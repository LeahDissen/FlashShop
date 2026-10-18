/**
 * Photo development pricing: a base price per size, a quantity discount by total prints in the order,
 * and an album discount by quantity. The settings are stored in the DB (photoPricingModel) and the admin edits them.
 * The defaults restore the price list that was hard-coded (1.80 ₪ down to 0.80 ₪ per photo).
 */
const DEFAULT_PHOTO_PRICING = Object.freeze({
    sizes: [
        { size: "10x15", price: 1.8 },
        { size: "13x18", price: 1.8 },
        { size: "15x20", price: 1.8 },
        { size: "21x29.7", price: 1.8 },
    ],
    quantityTiers: [
        { minQuantity: 40, discountPercent: 30.56 },
        { minQuantity: 100, discountPercent: 38.89 },
        { minQuantity: 200, discountPercent: 50 },
        { minQuantity: 500, discountPercent: 55.56 },
    ],
    albumDiscountTiers: [
        { minQuantity: 100, percent: 10 },
        { minQuantity: 200, percent: 15 },
        { minQuantity: 400, percent: 20 },
    ],
});

const roundToAgora = (value) => Math.round(value * 100) / 100;

const normalizeSize = (size) => String(size || "").toLowerCase().replace(/×/g, "x").trim();

/** The quantity discount percent that applies to the total number of prints */
const getQuantityDiscountPercent = (pricing, totalPrints) => {
    const count = Math.max(0, Number(totalPrints) || 0);
    const tier = [...(pricing.quantityTiers || [])]
        .sort((a, b) => b.minQuantity - a.minQuantity)
        .find((t) => count >= t.minQuantity);
    return tier ? tier.discountPercent : 0;
};

/** Price per photo of a given size, after the quantity discount (rounded to the agora) */
const getPhotoUnitPrice = (pricing, size, totalPrints) => {
    const sizes = pricing.sizes || [];
    const entry = sizes.find((s) => normalizeSize(s.size) === normalizeSize(size)) || sizes[0];
    const basePrice = Number(entry?.price) || 0;
    return roundToAgora(basePrice * (1 - getQuantityDiscountPercent(pricing, totalPrints) / 100));
};

const isPhotoPrintItem = (item) =>
    item?.itemType === "photo-print" ||
    String(item?.name || "").startsWith("פיתוח תמונה");

module.exports = {
    DEFAULT_PHOTO_PRICING,
    getQuantityDiscountPercent,
    getPhotoUnitPrice,
    isPhotoPrintItem,
};
