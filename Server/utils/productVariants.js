/**
 * Product colors and sizes, and stock tracking. A product may have colors, sizes, both or neither.
 * When stock tracking is on, a product with colors/sizes keeps one stock count per combination
 * (color × size); a product without them uses its single `stock` field.
 */

const MAX_COLORS = 20;
const MAX_SIZES = 30;
const MAX_LABEL_LENGTH = 40;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const cleanLabel = (value) => String(value ?? "").trim().slice(0, MAX_LABEL_LENGTH);

const httpsOrEmpty = (value) => {
    try {
        const url = new URL(String(value || ""));
        return url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
};

const toStockCount = (value) => {
    const num = Math.floor(Number(value));
    return Number.isFinite(num) && num > 0 ? num : 0;
};

function sanitizeColors(list) {
    const seen = new Set();
    return (Array.isArray(list) ? list : [])
        .map((c) => ({
            name: cleanLabel(c?.name),
            hex: HEX_COLOR.test(String(c?.hex || "")) ? String(c.hex).toUpperCase() : "#FFFFFF",
            image: httpsOrEmpty(c?.image),
        }))
        .filter((c) => c.name && !seen.has(c.name) && seen.add(c.name))
        .slice(0, MAX_COLORS);
}

function sanitizeSizes(list) {
    return [...new Set((Array.isArray(list) ? list : []).map(cleanLabel).filter(Boolean))].slice(0, MAX_SIZES);
}

/** Every color × size combination of the product ("" stands for a missing dimension) */
function variantCombinations(colors, sizes) {
    const colorNames = colors.length ? colors.map((c) => c.name) : [""];
    const sizeNames = sizes.length ? sizes : [""];
    return colorNames.flatMap((color) => sizeNames.map((size) => ({ color, size })));
}

/** Keeps one stock row per existing combination; a new combination starts at 0 */
function sanitizeVariantStock(list, colors, sizes) {
    if (!colors.length && !sizes.length) return [];
    const given = new Map((Array.isArray(list) ? list : [])
        .map((row) => [`${cleanLabel(row?.color)}|${cleanLabel(row?.size)}`, toStockCount(row?.stock)]));
    return variantCombinations(colors, sizes)
        .map(({ color, size }) => ({ color, size, stock: given.get(`${color}|${size}`) ?? 0 }));
}

/** Cleans the variant fields of a product create/update body in place */
function sanitizeVariantFields(data) {
    if (data.trackStock !== undefined) data.trackStock = data.trackStock === true || data.trackStock === "true";
    const touched = data.colors !== undefined || data.sizes !== undefined || data.variantStock !== undefined;
    if (!touched) return data;
    data.colors = sanitizeColors(data.colors);
    data.sizes = sanitizeSizes(data.sizes);
    data.variantStock = sanitizeVariantStock(data.variantStock, data.colors, data.sizes);
    return data;
}

const hasVariants = (product) => Boolean(product?.colors?.length || product?.sizes?.length);

/** "אדום · M" – shown next to the product name in the cart, orders and emails */
const variantLabel = (variant) => [variant?.color, variant?.size].filter(Boolean).join(" · ");

/**
 * The color/size the customer chose, checked against the product's options.
 * @returns {{ variant: { color: string, size: string } | undefined } | { error: string }}
 */
function resolveVariant(product, raw) {
    if (!hasVariants(product)) return { variant: undefined };
    const color = cleanLabel(raw?.color);
    const size = cleanLabel(raw?.size);
    if (product.colors?.length && !product.colors.some((c) => c.name === color)) {
        return { error: `יש לבחור צבע עבור "${product.name}"` };
    }
    if (product.sizes?.length && !product.sizes.includes(size)) {
        return { error: `יש לבחור מידה עבור "${product.name}"` };
    }
    return {
        variant: {
            color: product.colors?.length ? color : "",
            size: product.sizes?.length ? size : "",
        },
    };
}

/** How many units can still be sold (Infinity when the product does not track stock) */
function availableStock(product, variant) {
    if (!product?.trackStock) return Infinity;
    if (!hasVariants(product)) return Math.max(0, Number(product.stock) || 0);
    const row = (product.variantStock || [])
        .find((r) => r.color === (variant?.color || "") && r.size === (variant?.size || ""));
    return Math.max(0, Number(row?.stock) || 0);
}

module.exports = {
    sanitizeVariantFields,
    hasVariants,
    variantLabel,
    resolveVariant,
    availableStock,
    variantCombinations,
};
