/** Cart lines from the product page, and the designer request's contact checks */
import { withTieredPricingFields } from '../../utils/cartItem';

/** Added to the product price when the shop's designer creates the design (the server adds the same) */
export const DESIGNER_SERVICE_FEE = 15;
/** "עיצוב מותאם": photos the customer can attach for the designer */
export const MAX_DESIGNER_IMAGES = 6;

/**
 * A cart line for this product. A magnet has a fixed price; other products carry their quantity tiers
 * so the cart can reprice them (priceAddon: a fee on top of each unit, like the designer's).
 */
export function buildProductCartItem({ product, quantity, unitPrice, isMagnet, overrides = {}, priceAddon = 0 }) {
    const item = {
        productId: product._id,
        name: product.name,
        price: unitPrice,
        image: product.image,
        quantity,
        ...overrides,
    };
    return isMagnet ? item : withTieredPricingFields(item, product, { priceAddon });
}

/** The designer request before the customer filled it */
export const EMPTY_DESIGNER_REQUEST = { name: '', email: '', phone: '', description: '', referenceImages: [] };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @returns {string|null} the message to show, or null when the phone and email look valid */
export function validateDesignerContact({ phone, email }) {
    // An Israeli phone number: 9–10 digits, dashes and spaces allowed
    const cleanPhone = String(phone || '').replace(/[-\s]/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 10 || Number.isNaN(Number(cleanPhone))) {
        return 'אנא הזן מספר טלפון תקין';
    }
    if (!EMAIL_PATTERN.test(email || '')) return 'אנא הזן כתובת אימייל תקינה';
    return null;
}
