import { getUnitPriceForQuantity, hasTieredPricing, normalizePriceTiers } from './productQuantityPricing';

const OBJECT_ID_PREFIX = /^([a-f0-9]{24})-/i;

const createCartLineId = (productId, index = 0) =>
    `line-${productId || 'item'}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;

export const extractProductIdFromLineId = (lineId) => {
    if (!lineId || typeof lineId !== 'string') return undefined;
    const match = lineId.match(OBJECT_ID_PREFIX);
    return match ? match[1] : undefined;
};

export const normalizeCartItem = (item) => {
    const productId =
        item.productId ||
        item.product_id ||
        extractProductIdFromLineId(item.id);

    const { _id, ...rest } = item;
    return productId ? { ...rest, productId } : rest;
};

/** מוודא שלכל שורה בעגלה יש מזהה שורה ייחודי — בלי לדרוס מזהים קיימים */
export const assignCartLineIds = (items) => {
    const seen = new Set();
    return items.map((item, index) => {
        const normalized = normalizeCartItem(item);
        if (normalized.id && !seen.has(normalized.id)) {
            seen.add(normalized.id);
            return normalized;
        }
        const newId = createCartLineId(normalized.productId, index);
        seen.add(newId);
        return { ...normalized, id: newId };
    });
};

/** שומר נתוני מדרגות מחיר על פריט עגלה לחישוב מחדש בעת שינוי כמות */
export const withTieredPricingFields = (item, product, { priceAddon = 0 } = {}) => {
    if (!product || !hasTieredPricing(product)) {
        return item;
    }
    return {
        ...item,
        basePrice: Number(product.price) || 0,
        priceTiers: product.priceTiers ?? [],
        priceAddon: Number(priceAddon) || 0,
    };
};

export const resolveCartItemUnitPrice = (item, quantity) => {
    const tiers = normalizePriceTiers(item?.priceTiers);
    if (!tiers.length) {
        return Number(item?.price) || 0;
    }
    const basePrice = item.basePrice ?? Number(item.price) ?? 0;
    const tierPrice = getUnitPriceForQuantity(
        { price: basePrice, priceTiers: item.priceTiers },
        quantity,
    );
    return tierPrice + (Number(item.priceAddon) || 0);
};

export const applyQuantityToCartItem = (item, quantity) => {
    const qty = Math.min(9999, Math.max(1, Math.floor(Number(quantity)) || 1));
    if (!normalizePriceTiers(item?.priceTiers).length) {
        return { ...item, quantity: qty };
    }
    return {
        ...item,
        quantity: qty,
        price: resolveCartItemUnitPrice(item, qty),
    };
};

export const toCheckoutItem = (item) => {
    const normalized = normalizeCartItem(item);
    return {
        id: normalized.id,
        productId: normalized.productId,
        name: normalized.name,
        size: normalized.size,
        quantity: normalized.quantity,
        price: normalized.price,
        image: normalized.image,
        customDesign: normalized.customDesign,
        customization: normalized.customization,
    };
};
