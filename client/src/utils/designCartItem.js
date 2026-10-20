/**
 * Cart lines for a design made in the editor. The prices here are only for display in the cart:
 * the server always prices the order from the product itself.
 */
import { getUnitPriceForQuantity } from './productQuantityPricing';
import { withTieredPricingFields } from './cartItem';

const DESIGN_SUFFIX = 'בעיצוב אישי';
const FALLBACK_NAME = `מוצר ${DESIGN_SUFFIX}`;
const FALLBACK_PRICE = 24.99;
const FALLBACK_PRODUCT_ID = 'custom_product';

/** The production list of captions saved with the order: every text element that has content */
export const collectCaptions = (elements) => (elements || [])
    .filter((el) => el.type === 'text' && el.content?.trim())
    .map((el) => ({
        content: el.content,
        fontFamily: el.fontFamily,
        fontSize: el.fontSize,
        color: el.color,
        isCaption: el.role === 'caption',
    }));

/** A price written on the product ("₪49.90", "49") as a number, or null */
const parsePrice = (value) => {
    if (value === undefined || value === null) return null;
    const parsed = parseFloat(String(value).replace(/[^\d.]/g, ''));
    return !Number.isNaN(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Name, display price and id of the product a design is for.
 * @param {object|string|null} product the product object (or, in old saved projects, just its name)
 * @param {{ quantity?: number, tieredPrice?: boolean }} options tieredPrice: the price for this quantity
 */
export function describeDesignProduct(product, { quantity = 1, tieredPrice = false } = {}) {
    if (typeof product === 'string') {
        return { name: `${product} ${DESIGN_SUFFIX}`, price: FALLBACK_PRICE, productId: FALLBACK_PRODUCT_ID };
    }
    if (!product || typeof product !== 'object') {
        return { name: FALLBACK_NAME, price: FALLBACK_PRICE, productId: FALLBACK_PRODUCT_ID };
    }

    let price = FALLBACK_PRICE;
    if (product.price !== undefined && product.price !== null) {
        const tiered = tieredPrice ? getUnitPriceForQuantity(product, quantity) : 0;
        price = tiered > 0 ? tiered : (parsePrice(product.price) ?? FALLBACK_PRICE);
    }
    return {
        name: product.name ? `${product.name} ${DESIGN_SUFFIX}` : FALLBACK_NAME,
        price,
        productId: product._id || product.id || FALLBACK_PRODUCT_ID,
    };
}

/**
 * A cart line for a designed product.
 * @param {{ product: object|string|null, quantity?: number, tieredPrice?: boolean, image?: string, customDesign: object }} params
 */
export function buildDesignCartItem({ product, quantity = 1, tieredPrice = false, image, customDesign }) {
    const { name, price, productId } = describeDesignProduct(product, { quantity, tieredPrice });
    const productObject = product && typeof product === 'object' ? product : null;
    return withTieredPricingFields({
        id: `cart_${Date.now()}`,
        productId,
        name: name.includes('עיצוב אישי') ? name : `${name} ${DESIGN_SUFFIX}`,
        price,
        image,
        quantity,
        size: productObject ? productObject.size : undefined,
        customDesign,
    }, productObject);
}
