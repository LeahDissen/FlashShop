/**
 * תמחור פיתוח תמונות לפי המחירון שהמנהלת מגדירה (נטען מהשרת):
 * מחיר בסיס לכל גודל, הנחת כמות לפי סך כל ההדפסות, והנחה על אלבום.
 * אותו חישוב רץ בשרת בזמן יצירת ההזמנה (Server/utils/photoQuantityPricing.js).
 */

/** שם קטגוריית האלבומים במוצרים (לקישור "לבחירת אלבום") */
export const ALBUM_CATEGORY = 'אלבום';

const roundToAgora = (value) => Math.round(value * 100) / 100;
const normalizeSize = (size) => String(size || '').toLowerCase().replace(/×/g, 'x').trim();
const byMinAsc = (a, b) => a.minQuantity - b.minQuantity;

export const formatShekel = (amount) => `${Number(amount).toFixed(2)} ₪`;

export function getTotalPrintCount(images = []) {
    return images.reduce((sum, img) => sum + Math.max(1, Number(img.quantity) || 1), 0);
}

export function getQuantityDiscountPercent(pricing, totalPrints) {
    const count = Math.max(0, Number(totalPrints) || 0);
    const tier = [...(pricing?.quantityTiers || [])].sort(byMinAsc).reverse().find((t) => count >= t.minQuantity);
    return tier ? tier.discountPercent : 0;
}

/** מחיר לתמונה בגודל נתון, אחרי הנחת הכמות */
export function getPhotoUnitPrice(pricing, size, totalPrints) {
    const sizes = pricing?.sizes || [];
    const entry = sizes.find((s) => normalizeSize(s.size) === normalizeSize(size)) || sizes[0];
    const basePrice = Number(entry?.price) || 0;
    return roundToAgora(basePrice * (1 - getQuantityDiscountPercent(pricing, totalPrints) / 100));
}

/** סיכום ההזמנה: כמות כוללת, סה"כ לתשלום ואחוז הנחת הכמות */
export function getOrderPricing(images, pricing, defaultSize) {
    const totalPrints = getTotalPrintCount(images);
    const grandTotal = images.reduce((sum, img) => {
        const quantity = Math.max(1, Number(img.quantity) || 1);
        return sum + quantity * getPhotoUnitPrice(pricing, img.size || defaultSize, totalPrints);
    }, 0);
    return {
        totalPrints,
        grandTotal: roundToAgora(grandTotal),
        discountPercent: getQuantityDiscountPercent(pricing, totalPrints),
    };
}

/** "עוד X הדפסות ותקבלי Y% הנחה" — או null במדרגה האחרונה */
export function getNextPricingTierHint(totalPrints, pricing) {
    const next = [...(pricing?.quantityTiers || [])].sort(byMinAsc).find((t) => totalPrints < t.minQuantity);
    if (!next) return null;
    return `עוד ${next.minQuantity - totalPrints} הדפסות ותקבלי ${next.discountPercent}% הנחה על כל התמונות`;
}

export function getAlbumDiscount(totalPrints, pricing) {
    const tier = [...(pricing?.albumDiscountTiers || [])].sort(byMinAsc).reverse()
        .find((t) => totalPrints >= t.minQuantity);
    return tier?.percent ? { percent: tier.percent } : null;
}

/** שורות טבלת המחירים: לכל מדרגת כמות — המחיר לכל גודל, עם סימון המדרגה הפעילה */
export function getPricingTableDisplay(pricing, totalPrints = 0) {
    const tiers = [...(pricing?.quantityTiers || [])].sort(byMinAsc);
    const starts = [1, ...tiers.map((t) => t.minQuantity).filter((min) => min > 1)];
    return starts.map((min, index) => {
        const nextMin = starts[index + 1];
        return {
            key: min,
            rangeLabel: nextMin ? `${min}–${nextMin - 1}` : `${min}+`,
            isActive: totalPrints >= min && (!nextMin || totalPrints < nextMin),
            prices: (pricing?.sizes || []).map((s) => ({
                size: s.size,
                price: getPhotoUnitPrice(pricing, s.size, min),
            })),
        };
    });
}
