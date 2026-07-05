/** תמחור מוצר לפי מדרגות כמות — מקור אמת לתצוגה ולחישוב */

function normalizeMaxQuantity(value) {
    if (value == null || value === '') return null;
    if (value === Infinity || value === 'Infinity') return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

export function normalizePriceTiers(tiers = []) {
    return [...tiers]
        .filter((t) => t && t.minQuantity != null && t.unitPrice != null && t.unitPrice !== '')
        .map((t) => {
            const max = normalizeMaxQuantity(t.maxQuantity);
            return {
                min: Number(t.minQuantity),
                max,
                unitPrice: Number(t.unitPrice),
            };
        })
        .filter((t) => Number.isFinite(t.min) && Number.isFinite(t.unitPrice))
        .sort((a, b) => a.min - b.min);
}

export function hasTieredPricing(product) {
    return normalizePriceTiers(product?.priceTiers).length > 0;
}

export function getUnitPriceForQuantity(product, quantity) {
    const fixedPrice = Number(product?.price) || 0;
    const tiers = normalizePriceTiers(product?.priceTiers);
    if (tiers.length === 0) return fixedPrice;

    const qty = Math.max(1, Number(quantity) || 1);
    const tier = tiers.find((t) => {
        if (qty < t.min) return false;
        if (t.max == null) return true;
        return qty <= t.max;
    });
    return tier ? tier.unitPrice : fixedPrice;
}

export function formatQuantityRangeParts(row) {
    if (row.max == null) {
        return { ltr: `${row.min}+`, suffix: ' ומעלה' };
    }
    if (row.min === 1) {
        return { ltr: `1–${row.max}`, suffix: ' יחידות' };
    }
    return { ltr: `${row.min}–${row.max}`, suffix: ' יחידות' };
}

export function formatQuantityRange(row) {
    const parts = formatQuantityRangeParts(row);
    return `${parts.ltr}${parts.suffix}`;
}

export function isQuantityInTier(quantity, tier) {
    const qty = Math.max(0, quantity);
    if (qty < tier.min) return false;
    if (tier.max == null) return true;
    return qty <= tier.max;
}

export function getProductPricingTableDisplay(product, quantity = 0) {
    const tiers = normalizePriceTiers(product?.priceTiers);
    return tiers.map((tier) => {
        const parts = formatQuantityRangeParts(tier);
        return {
            ...tier,
            rangeLtr: parts.ltr,
            rangeSuffix: parts.suffix,
            rangeLabel: `${parts.ltr}${parts.suffix}`,
            priceLabel: `${tier.unitPrice.toFixed(2)} ₪`,
            isActive: isQuantityInTier(quantity, tier),
        };
    });
}

export function formatPrice(amount) {
    return `${Number(amount).toFixed(2)} ₪`;
}

export function getProductOrderPricing(product, quantity = 1) {
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = getUnitPriceForQuantity(product, qty);
    return {
        quantity: qty,
        unitPrice,
        grandTotal: qty * unitPrice,
    };
}

export function validatePriceTiers(tiers) {
    const normalized = normalizePriceTiers(tiers);
    if (normalized.length === 0) {
        return { valid: false, message: 'יש להוסיף לפחות מדרגת מחיר אחת' };
    }

    for (let i = 0; i < normalized.length; i++) {
        const tier = normalized[i];
        const isLast = i === normalized.length - 1;
        if (tier.min < 1) {
            return { valid: false, message: 'כמות מינימום חייבת להיות לפחות 1' };
        }
        if (tier.unitPrice < 0) {
            return { valid: false, message: 'מחיר ליחידה לא יכול להיות שלילי' };
        }
        if (!isLast && tier.max == null) {
            return {
                valid: false,
                message: `מדרגה ${i + 1}: יש להזין מקסימום (ללא הגבלה מותר רק במדרגה האחרונה)`,
            };
        }
        if (tier.max != null && tier.max < tier.min) {
            return { valid: false, message: `מדרגה ${i + 1}: כמות מקסימום קטנה ממינימום` };
        }
        if (i > 0) {
            const prev = normalized[i - 1];
            if (prev.max == null) {
                return { valid: false, message: 'רק המדרגה האחרונה יכולה להיות ללא מקסימום' };
            }
            if (tier.min <= prev.max) {
                return { valid: false, message: 'מדרגות המחיר חייבות להיות רציפות וללא חפיפה' };
            }
            if (tier.min !== prev.max + 1) {
                return { valid: false, message: `חסרה כיסוי בין ${prev.max} ל-${tier.min} יחידות` };
            }
        }
    }

    return { valid: true, tiers: normalized };
}

/** המרה לשמירה ב-API */
export function serializePriceTiers(tiers) {
    const result = validatePriceTiers(tiers);
    if (!result.valid) return [];
    return result.tiers.map((t) => {
        const row = {
            minQuantity: t.min,
            unitPrice: t.unitPrice,
        };
        if (t.max != null) {
            row.maxQuantity = t.max;
        }
        return row;
    });
}
