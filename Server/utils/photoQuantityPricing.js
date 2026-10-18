/**
 * תמחור פיתוח תמונות: לכל גודל הדפסה יש מדרגות מחיר משלו (מכמה תמונות, ובכמה ₪ לתמונה).
 * הכמות שקובעת את המדרגה היא מספר ההדפסות באותו גודל בהזמנה.
 * ההגדרות נשמרות ב-DB (photoPricingModel) והמנהלת עורכת אותן במסך "מחירי פיתוח תמונות".
 */
const DEFAULT_PHOTO_PRICING = Object.freeze({
    sizes: [
        {
            size: "10x15",
            tiers: [
                { minQuantity: 1, price: 1.8 },
                { minQuantity: 40, price: 1.25 },
                { minQuantity: 100, price: 1.1 },
                { minQuantity: 200, price: 0.9 },
                { minQuantity: 500, price: 0.8 },
            ],
        },
        { size: "13x18", tiers: [{ minQuantity: 1, price: 1.8 }] },
        { size: "15x20", tiers: [{ minQuantity: 1, price: 1.8 }] },
        { size: "21x29.7", tiers: [{ minQuantity: 1, price: 1.8 }] },
    ],
    albumDiscountTiers: [
        { minQuantity: 100, percent: 10 },
        { minQuantity: 200, percent: 15 },
        { minQuantity: 400, percent: 20 },
    ],
});

const normalizeSize = (size) => String(size || "").toLowerCase().replace(/×/g, "x").trim();

const findSizeEntry = (pricing, size) => {
    const sizes = pricing?.sizes || [];
    return sizes.find((s) => normalizeSize(s.size) === normalizeSize(size)) || sizes[0];
};

/** מחיר לתמונה בגודל נתון כשמזמינים `quantity` הדפסות מהגודל הזה */
const getPhotoUnitPrice = (pricing, size, quantity) => {
    const count = Math.max(1, Number(quantity) || 0);
    const tier = [...(findSizeEntry(pricing, size)?.tiers || [])]
        .sort((a, b) => b.minQuantity - a.minQuantity)
        .find((t) => count >= t.minQuantity);
    return tier ? Number(tier.price) : 0;
};

/** כמה הדפסות יש מכל גודל (המפתח מנורמל, למשל "10x15") */
const countPrintsBySize = (items, getSize, getQuantity) => items.reduce((counts, item) => {
    const key = normalizeSize(getSize(item));
    counts[key] = (counts[key] || 0) + Math.max(1, Number(getQuantity(item)) || 1);
    return counts;
}, {});

const isPhotoPrintItem = (item) =>
    item?.itemType === "photo-print" ||
    String(item?.name || "").startsWith("פיתוח תמונה");

module.exports = {
    DEFAULT_PHOTO_PRICING,
    normalizeSize,
    getPhotoUnitPrice,
    countPrintsBySize,
    isPhotoPrintItem,
};
