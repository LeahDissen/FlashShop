const { PhotoPricingModel } = require("../models/photoPricingModel");
const { DEFAULT_PHOTO_PRICING } = require("../utils/photoQuantityPricing");

const PRICING_FIELDS = ["sizes", "quantityTiers", "albumDiscountTiers"];

/** The saved price list, or the default if none has been saved yet */
exports.loadPhotoPricing = async () => {
    const saved = await PhotoPricingModel.findOne({ key: "default" }).lean();
    if (!saved) return { ...DEFAULT_PHOTO_PRICING };
    return Object.fromEntries(PRICING_FIELDS.map((field) => [field, saved[field]]));
};

const toNumber = (value) => (value === "" || value === null || value === undefined ? NaN : Number(value));

/**
 * Validates and normalizes a price list received from the admin.
 * @returns {{ value?: object, error?: string }}
 */
exports.validatePhotoPricing = (body = {}) => {
    const sizes = (Array.isArray(body.sizes) ? body.sizes : []).map((s) => ({
        size: String(s?.size || "").trim(),
        price: toNumber(s?.price),
    }));
    if (sizes.length === 0 || sizes.some((s) => !s.size || !Number.isFinite(s.price) || s.price < 0)) {
        return { error: "יש להזין מחיר תקין (0 ומעלה) לכל גודל" };
    }

    const parseTiers = (list, percentKey) => (Array.isArray(list) ? list : []).map((t) => ({
        minQuantity: toNumber(t?.minQuantity),
        [percentKey]: toNumber(t?.[percentKey]),
    }));
    const isValidTier = (percentKey) => (t) =>
        Number.isInteger(t.minQuantity) && t.minQuantity >= 1
        && Number.isFinite(t[percentKey]) && t[percentKey] >= 0 && t[percentKey] <= 100;
    const hasDuplicateMin = (tiers) => new Set(tiers.map((t) => t.minQuantity)).size !== tiers.length;

    const quantityTiers = parseTiers(body.quantityTiers, "discountPercent");
    if (!quantityTiers.every(isValidTier("discountPercent")) || hasDuplicateMin(quantityTiers)) {
        return { error: "מדרגות הכמות: כמות התחלה מספר שלם (1 ומעלה) ושונה בכל שורה, והנחה בין 0 ל-100%" };
    }

    const albumDiscountTiers = parseTiers(body.albumDiscountTiers, "percent");
    if (!albumDiscountTiers.every(isValidTier("percent")) || hasDuplicateMin(albumDiscountTiers)) {
        return { error: "הנחות האלבום: כמות התחלה מספר שלם (1 ומעלה) ושונה בכל שורה, והנחה בין 0 ל-100%" };
    }

    const byMin = (a, b) => a.minQuantity - b.minQuantity;
    return {
        value: {
            sizes,
            quantityTiers: quantityTiers.sort(byMin),
            albumDiscountTiers: albumDiscountTiers.sort(byMin),
        },
    };
};
