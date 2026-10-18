const { PhotoPricingModel } = require("../models/photoPricingModel");
const { DEFAULT_PHOTO_PRICING } = require("../utils/photoQuantityPricing");

const roundToAgora = (value) => Math.round(value * 100) / 100;
const byMinQuantity = (a, b) => a.minQuantity - b.minQuantity;

/**
 * המרה מהמבנה הקודם (מחיר בסיס לכל גודל + מדרגות כלליות ב"אחוז הנחה").
 * במסמך השמור הוזנו בשדה האחוז ערכים שהם בעצם מחירים בש"ח (1.30, 1.20...), ולכן:
 * אם כל ה"אחוזים" קטנים ממחיר הבסיס של הגודל הראשון – הם מחירים של הגודל הראשון;
 * אחרת הם אחוזי הנחה אמיתיים ומחושבים לכל גודל.
 */
const convertLegacyPricing = (legacy) => {
    const legacySizes = Array.isArray(legacy.sizes) ? legacy.sizes : [];
    const legacyTiers = (Array.isArray(legacy.quantityTiers) ? legacy.quantityTiers : [])
        .filter((t) => t.minQuantity > 1)
        .sort(byMinQuantity);
    const firstBasePrice = Number(legacySizes[0]?.price) || 0;
    const valuesArePrices = legacyTiers.length > 0
        && legacyTiers.every((t) => Number(t.discountPercent) < firstBasePrice);

    const sizes = legacySizes.map((entry, index) => {
        const basePrice = Number(entry.price) || 0;
        const tiers = [{ minQuantity: 1, price: basePrice }];
        if (valuesArePrices && index === 0) {
            tiers.push(...legacyTiers.map((t) => ({ minQuantity: t.minQuantity, price: Number(t.discountPercent) })));
        } else if (!valuesArePrices) {
            tiers.push(...legacyTiers.map((t) => ({
                minQuantity: t.minQuantity,
                price: roundToAgora(basePrice * (1 - Number(t.discountPercent) / 100)),
            })));
        }
        return { size: entry.size, tiers };
    });

    return { sizes, albumDiscountTiers: legacy.albumDiscountTiers || [] };
};

const isLegacyPricing = (doc) => Array.isArray(doc.quantityTiers)
    || (Array.isArray(doc.sizes) && doc.sizes.some((s) => s.price !== undefined && !s.tiers));

/** המחירון השמור, או ברירת המחדל אם עוד לא נשמר */
exports.loadPhotoPricing = async () => {
    const saved = await PhotoPricingModel.findOne({ key: "default" }).lean();
    if (!saved) return structuredClone(DEFAULT_PHOTO_PRICING);
    if (isLegacyPricing(saved)) return convertLegacyPricing(saved);
    return { sizes: saved.sizes, albumDiscountTiers: saved.albumDiscountTiers };
};

const toNumber = (value) => (value === "" || value === null || value === undefined ? NaN : Number(value));
const hasDuplicateMin = (tiers) => new Set(tiers.map((t) => t.minQuantity)).size !== tiers.length;

/**
 * בודק ומנרמל מחירון שהגיע מהאדמין.
 * @returns {{ value?: object, error?: string }}
 */
exports.validatePhotoPricing = (body = {}) => {
    const sizes = (Array.isArray(body.sizes) ? body.sizes : []).map((entry) => ({
        size: String(entry?.size || "").trim(),
        tiers: (Array.isArray(entry?.tiers) ? entry.tiers : [])
            .map((t) => ({ minQuantity: toNumber(t?.minQuantity), price: toNumber(t?.price) }))
            .sort(byMinQuantity),
    }));
    if (sizes.length === 0 || sizes.some((s) => !s.size)) {
        return { error: "חסרים גדלי הדפסה במחירון" };
    }
    for (const { size, tiers } of sizes) {
        const valid = tiers.every((t) => Number.isInteger(t.minQuantity) && t.minQuantity >= 1
            && Number.isFinite(t.price) && t.price >= 0);
        if (!valid || hasDuplicateMin(tiers)) {
            return { error: `גודל ${size}: כל מדרגה צריכה כמות שלמה (1 ומעלה), שונה מהאחרות, ומחיר 0 ומעלה` };
        }
        if (tiers[0]?.minQuantity !== 1) {
            return { error: `גודל ${size}: המדרגה הראשונה צריכה להתחיל מתמונה אחת` };
        }
    }

    const albumDiscountTiers = (Array.isArray(body.albumDiscountTiers) ? body.albumDiscountTiers : [])
        .map((t) => ({ minQuantity: toNumber(t?.minQuantity), percent: toNumber(t?.percent) }))
        .sort(byMinQuantity);
    const albumValid = albumDiscountTiers.every((t) => Number.isInteger(t.minQuantity) && t.minQuantity >= 1
        && Number.isFinite(t.percent) && t.percent >= 0 && t.percent <= 100);
    if (!albumValid || hasDuplicateMin(albumDiscountTiers)) {
        return { error: "הנחות האלבום: כמות שלמה (1 ומעלה) ושונה בכל שורה, והנחה בין 0 ל-100%" };
    }

    return { value: { sizes, albumDiscountTiers } };
};
