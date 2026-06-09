import { DISPLAY_TYPES, getDisplayTypeForCategory } from '../constants/productCategories';

export function resolveProductDisplayType(product) {
    if (product?.displayType) return product.displayType;
    if (product?.category) return getDisplayTypeForCategory(product.category);
    return DISPLAY_TYPES.DESIGN;
}

export function isSimpleProduct(product) {
    return resolveProductDisplayType(product) === DISPLAY_TYPES.SIMPLE;
}

export function isMagnetProduct(product) {
    return resolveProductDisplayType(product) === DISPLAY_TYPES.MAGNET;
}

export function isDesignProduct(product) {
    return resolveProductDisplayType(product) === DISPLAY_TYPES.DESIGN;
}

export function getProductDirectLink(productId) {
    if (typeof window === 'undefined') return `/product-selection/${productId}`;
    return `${window.location.origin}/product-selection/${productId}`;
}
