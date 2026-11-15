/**
 * Product colors and sizes and stock tracking on the client (the server checks the same rules at checkout).
 * Stock is tracked only on products where the admin turned it on; then a product with colors/sizes
 * has a stock count per color × size combination.
 */

export const hasVariants = (product) => Boolean(product?.colors?.length || product?.sizes?.length);

/** "אדום · M" */
export const variantLabel = (variant) => [variant?.color, variant?.size].filter(Boolean).join(' · ');

/** Every color × size combination ("" = no such dimension) */
export function variantCombinations(colors = [], sizes = []) {
    const colorNames = colors.length ? colors.map((c) => c.name) : [''];
    const sizeNames = sizes.length ? sizes : [''];
    return colorNames.flatMap((color) => sizeNames.map((size) => ({ color, size })));
}

/** Units left for the choice (Infinity without stock tracking; null while the choice is incomplete) */
export function availableStock(product, variant) {
    if (!product?.trackStock) return Infinity;
    if (!hasVariants(product)) return Math.max(0, Number(product.stock) || 0);
    if (!isVariantComplete(product, variant)) return null;
    const row = (product.variantStock || [])
        .find((r) => r.color === (variant.color || '') && r.size === (variant.size || ''));
    return Math.max(0, Number(row?.stock) || 0);
}

/** Whether every option the product has (color, size) was chosen */
export const isVariantComplete = (product, variant) =>
    (!product?.colors?.length || Boolean(variant?.color)) && (!product?.sizes?.length || Boolean(variant?.size));

/** Whether an option value is sold out given the other chosen value (for greying out buttons) */
export function isOptionSoldOut(product, { color, size }) {
    if (!product?.trackStock || !hasVariants(product)) return false;
    return !(product.variantStock || []).some((r) =>
        (color === undefined || r.color === color) && (size === undefined || r.size === size) && Number(r.stock) > 0);
}

/** The whole product is sold out (only when it tracks stock) */
export function isSoldOut(product) {
    if (!product?.trackStock) return false;
    if (!hasVariants(product)) return !(Number(product.stock) > 0);
    return !(product.variantStock || []).some((r) => Number(r.stock) > 0);
}

/** The variant chosen, as saved on the cart line ("" for a dimension the product does not have) */
export const cartVariant = (product, variant) => (hasVariants(product)
    ? { color: product.colors?.length ? variant?.color || '' : '', size: product.sizes?.length ? variant?.size || '' : '' }
    : undefined);

/** The product name with the chosen color/size, as the server writes it on the order */
export function nameWithVariant(name, variant) {
    const label = variantLabel(variant);
    return label && !String(name).includes(label) ? `${name} (${label})` : name;
}

/** Sizes the admin can add in one click */
export const SIZE_PRESETS = {
    adults: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
    kids: ['2', '4', '6', '8', '10', '12', '14', '16'],
};
