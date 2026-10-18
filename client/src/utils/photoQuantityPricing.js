/**
 * תמחור פיתוח תמונות לפי המחירון שהמנהלת מגדירה (נטען מהשרת):
 * לכל גודל יש מדרגות מחיר בש"ח לפי כמות ההדפסות מאותו גודל, ובנוסף הנחה על אלבום לפי סך ההדפסות.
 * אותו חישוב רץ בשרת בזמן יצירת ההזמנה (Server/utils/photoQuantityPricing.js).
 */

/** שם קטגוריית האלבומים במוצרים (לקישור "לבחירת אלבום") */
export const ALBUM_CATEGORY = 'אלבום';

const roundToAgora = (value) => Math.round(value * 100) / 100;
export const normalizeSize = (size) => String(size || '').toLowerCase().replace(/×/g, 'x').trim();
const byMinAsc = (a, b) => a.minQuantity - b.minQuantity;
const quantityOf = (img) => Math.max(1, Number(img.quantity) || 1);

export const formatShekel = (amount) => `${Number(amount).toFixed(2)} ₪`;

const findSizeEntry = (pricing, size) => {
    const sizes = pricing?.sizes || [];
    return sizes.find((s) => normalizeSize(s.size) === normalizeSize(size)) || sizes[0];
};

const sortedTiers = (pricing, size) => [...(findSizeEntry(pricing, size)?.tiers || [])].sort(byMinAsc);

export function getTotalPrintCount(images = []) {
    return images.reduce((sum, img) => sum + quantityOf(img), 0);
}

/** כמה הדפסות מכל גודל: { '10x15': 45, ... } */
export function getPrintsBySize(images = [], defaultSize) {
    return images.reduce((counts, img) => {
        const key = normalizeSize(img.size || defaultSize);
        counts[key] = (counts[key] || 0) + quantityOf(img);
        return counts;
    }, {});
}

/** מחיר לתמונה בגודל נתון כשמזמינים `quantity` הדפסות מהגודל הזה */
export function getPhotoUnitPrice(pricing, size, quantity) {
    const count = Math.max(1, Number(quantity) || 0);
    const tier = sortedTiers(pricing, size).reverse().find((t) => count >= t.minQuantity);
    return tier ? Number(tier.price) : 0;
}

/** סיכום ההזמנה: כמות כוללת, סה"כ לתשלום, ופירוט לכל גודל */
export function getOrderPricing(images, pricing, defaultSize) {
    const printsBySize = getPrintsBySize(images, defaultSize);
    const sizes = Object.entries(printsBySize).map(([size, count]) => {
        const unitPrice = getPhotoUnitPrice(pricing, size, count);
        return { size, count, unitPrice, total: roundToAgora(unitPrice * count) };
    });
    return {
        totalPrints: getTotalPrintCount(images),
        grandTotal: roundToAgora(sizes.reduce((sum, s) => sum + s.total, 0)),
        sizes,
    };
}

/** "עוד X הדפסות בגודל Y והמחיר יורד ל-Z" – לגודל שהכי קרוב למדרגה הבאה; null אם אין */
export function getNextPricingTierHint(orderSizes, pricing, formatSize = (size) => size) {
    const candidates = (orderSizes || [])
        .map(({ size, count }) => {
            const next = sortedTiers(pricing, size).find((t) => count < t.minQuantity);
            return next ? { size, remaining: next.minQuantity - count, price: next.price } : null;
        })
        .filter(Boolean)
        .sort((a, b) => a.remaining - b.remaining);
    const best = candidates[0];
    if (!best) return null;
    return `עוד ${best.remaining} הדפסות בגודל ${formatSize(best.size)} והמחיר יורד ל-${formatShekel(best.price)} לתמונה`;
}

export function getAlbumDiscount(totalPrints, pricing) {
    const tier = [...(pricing?.albumDiscountTiers || [])].sort(byMinAsc).reverse()
        .find((t) => totalPrints >= t.minQuantity);
    return tier?.percent ? { percent: tier.percent } : null;
}

/** מדרגות המחיר של גודל אחד לתצוגה, עם סימון המדרגה הפעילה לפי מספר ההדפסות מהגודל */
export function getSizePriceRows(pricing, size, count = 0) {
    const tiers = sortedTiers(pricing, size);
    return tiers.map((tier, index) => {
        const next = tiers[index + 1];
        return {
            key: tier.minQuantity,
            rangeLabel: next ? `${tier.minQuantity}–${next.minQuantity - 1}` : `${tier.minQuantity}+`,
            price: Number(tier.price),
            isActive: count >= tier.minQuantity && (!next || count < next.minQuantity),
        };
    });
}
