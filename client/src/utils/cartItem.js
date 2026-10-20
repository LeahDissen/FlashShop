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

/** Makes sure every cart row has a unique row id — without overwriting existing ids */
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

/** Keeps price tier data on a cart item to recalculate when the quantity changes */
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

/** Keeps the frame choice and captions with the item in the cart and in the order */
/** A line with a separate design per copy: its quantity is the number of designs and cannot be changed in the cart */
export const hasDesignPerCopy = (item) => Array.isArray(item?.customDesign?.copies) && item.customDesign.copies.length > 0;

export const compactCustomDesignForCart = (customDesign) => {
    if (!customDesign || typeof customDesign !== 'object') return undefined;

    const compact = {
        projectId: customDesign.projectId,
        projectName: customDesign.projectName,
        canvasSize: customDesign.canvasSize,
        printSizeCm: customDesign.printSizeCm,
        frameSelection: customDesign.frameSelection || undefined,
        captions: Array.isArray(customDesign.captions) && customDesign.captions.length
            ? customDesign.captions
            : undefined,
        designFile: customDesign.designFile,
        // A separate design per copy: each copy's uploaded print file
        copies: Array.isArray(customDesign.copies) && customDesign.copies.length
            ? customDesign.copies
            : undefined,
    };

    const hasValue = Object.values(compact).some((value) => value != null);
    return hasValue ? compact : undefined;
};

export const toCheckoutItem = (item) => {
    const normalized = normalizeCartItem(item);
    return {
        id: normalized.id,
        productId: normalized.productId,
        itemType: normalized.itemType,
        name: normalized.name,
        size: normalized.size,
        quantity: normalized.quantity,
        price: normalized.price,
        image: normalized.image,
        customDesign: normalized.customDesign,
        customization: normalized.customization,
    };
};

/** A plain catalog product (no design, customization or photo print): the same product in two carts is one row */
const plainProductKey = (item) => {
    if (!item.productId || item.customDesign || item.customization || item.itemType) return null;
    return `${item.productId}|${item.size || ''}`;
};

/**
 * Adds the items a guest put in the cart to the account's saved cart, so nothing is lost on login.
 * The same plain product is merged into one row with the quantities added up; designs and photos stay separate rows.
 */
export const mergeGuestCart = (accountItems, guestItems) => {
    const merged = accountItems.map(normalizeCartItem);
    const ids = new Set(merged.map((item) => item.id));
    for (const guestItem of guestItems.map(normalizeCartItem)) {
        if (ids.has(guestItem.id)) continue;
        const key = plainProductKey(guestItem);
        const index = key ? merged.findIndex((item) => plainProductKey(item) === key) : -1;
        if (index >= 0) {
            merged[index] = applyQuantityToCartItem(merged[index], merged[index].quantity + guestItem.quantity);
        } else {
            merged.push(guestItem);
        }
    }
    return assignCartLineIds(merged);
};
