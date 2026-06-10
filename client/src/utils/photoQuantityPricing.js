/** תמחור פיתוח תמונות לפי סך כל ההדפסות (סכום quantity) */

/** מדרגות מחיר — מקור אמת יחיד לתצוגה ולחישוב */
export const PRICING_TABLE_ROWS = [
    { min: 1, max: 39, unitPrice: 1.8, label: 'עד 39 תמונות' },
    { min: 40, max: 99, unitPrice: 1.25, label: 'מ-40 תמונות' },
    { min: 100, max: 199, unitPrice: 1.1, label: 'מ-100 תמונות' },
    { min: 200, max: 499, unitPrice: 0.9, label: 'מ-200 תמונות' },
    { min: 500, max: null, unitPrice: 0.8, label: 'מ-500 תמונות' },
];

const QUANTITY_TIERS = [...PRICING_TABLE_ROWS]
    .map((row) => ({
        minQuantity: row.min,
        unitPrice: row.unitPrice,
        label: row.label,
    }))
    .sort((a, b) => b.minQuantity - a.minQuantity);

const ALBUM_DISCOUNT_TIERS = [
    { minQuantity: 400, percent: 20 },
    { minQuantity: 200, percent: 15 },
    { minQuantity: 100, percent: 10 },
];

export function getTotalPrintCount(images = []) {
    return images.reduce(
        (sum, img) => sum + Math.max(1, Number(img.quantity) || 1),
        0,
    );
}

export function getUnitPriceByQuantity(totalPrints) {
    const count = Math.max(0, totalPrints);
    const tier = QUANTITY_TIERS.find((t) => count >= t.minQuantity);
    return tier ? tier.unitPrice : 1.8;
}

export function getActiveQuantityTier(totalPrints) {
    const count = Math.max(0, totalPrints);
    return QUANTITY_TIERS.find((t) => count >= t.minQuantity) ?? QUANTITY_TIERS.at(-1);
}

export function getOrderTotal(images = []) {
    const totalPrints = getTotalPrintCount(images);
    return totalPrints * getUnitPriceByQuantity(totalPrints);
}

/** כמה עותקים חסרים למדרגת המחיר הבאה (זולה יותר) */
export function getNextPriceTierHint(totalPrints) {
    const count = Math.max(0, totalPrints);
    const tiersAsc = [...QUANTITY_TIERS].sort((a, b) => a.minQuantity - b.minQuantity);

    for (const tier of tiersAsc) {
        if (count < tier.minQuantity) {
            return {
                remaining: tier.minQuantity - count,
                nextUnitPrice: tier.unitPrice,
                nextLabel: tier.label,
            };
        }
    }
    return null;
}

export function getAlbumDiscountPercent(totalPrints) {
    const count = Math.max(0, totalPrints);
    const tier = ALBUM_DISCOUNT_TIERS.find((t) => count >= t.minQuantity);
    return tier ? tier.percent : 0;
}

export function getAlbumDiscountMessage(totalPrints) {
    const percent = getAlbumDiscountPercent(totalPrints);
    if (percent === 0) return null;
    return `בחרת ${totalPrints} הדפסות — מגיעה לך ${percent}% הנחה על אלבומי תמונות!`;
}

export function formatPrice(amount) {
    return `${Number(amount).toFixed(2)} ₪`;
}

/** שם קטגוריה לקישור לאלבומים (מתאים ל-category במוצרים) */
export const ALBUM_CATEGORY = 'אלבום';

export function getOrderPricing(images = []) {
    const totalPrints = getTotalPrintCount(images);
    const unitPrice = getUnitPriceByQuantity(totalPrints);
    const tier = getActiveQuantityTier(totalPrints);
    return {
        totalPrints,
        unitPrice,
        grandTotal: totalPrints * unitPrice,
        tier,
    };
}

export function getNextPricingTierHint(totalPrints) {
    const next = getNextPriceTierHint(totalPrints);
    if (!next) return null;
    return `עוד ${next.remaining} הדפסות ותקבלי ${next.nextUnitPrice.toFixed(2)} ₪ לתמונה (${next.nextLabel})`;
}

export function getAlbumDiscount(totalPrints) {
    const percent = getAlbumDiscountPercent(totalPrints);
    if (!percent) return null;
    return { percent };
}

export function formatQuantityRange(row) {
    if (row.max == null) return `${row.min} הדפסות ומעלה`;
    if (row.min === 1) return `1–${row.max} הדפסות`;
    return `${row.min}–${row.max} הדפסות`;
}

export function isQuantityInRow(totalPrints, row) {
    const count = Math.max(0, totalPrints);
    if (count < row.min) return false;
    if (row.max == null) return true;
    return count <= row.max;
}

/** שורות לטבלת תמחור — עם סימון המדרגה הפעילה */
export function getPricingTableDisplay(totalPrints = 0) {
    return PRICING_TABLE_ROWS.map((row) => ({
        ...row,
        rangeLabel: formatQuantityRange(row),
        priceLabel: `${row.unitPrice.toFixed(2)} ₪`,
        isActive: isQuantityInRow(totalPrints, row),
    }));
}
