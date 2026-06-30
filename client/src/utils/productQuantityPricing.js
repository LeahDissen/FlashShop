/** תמחור מוצר לפי מדרגות כמות — מקור אמת לתצוגה ולחישוב */

export function normalizePriceTiers(tiers = []) {
    return [...tiers]
        .filter((t) => t && t.minQuantity != null && t.unitPrice != null && t.unitPrice !== '')
        .map((t) => ({
            min: Number(t.minQuantity),
            max: t.maxQuantity == null || t.maxQuantity === '' ? null : Number(t.maxQuantity),
            unitPrice: Number(t.unitPrice),
        }))
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

export function formatQuantityRange(row) {
    if (row.max == null) return `${row.min} יחידות ומעלה`;
    if (row.min === 1) return `1–${row.max} יחידות`;
    return `${row.min}–${row.max} יחידות`;
}

export function isQuantityInTier(quantity, tier) {
    const qty = Math.max(0, quantity);
    if (qty < tier.min) return false;
    if (tier.max == null) return true;
    return qty <= tier.max;
}

export function getProductPricingTableDisplay(product, quantity = 0) {
    const tiers = normalizePriceTiers(product?.priceTiers);
    return tiers.map((tier) => ({
        ...tier,
        rangeLabel: formatQuantityRange(tier),
        priceLabel: `${tier.unitPrice.toFixed(2)} ₪`,
        isActive: isQuantityInTier(quantity, tier),
    }));
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
        if (tier.min < 1) {
            return { valid: false, message: 'כמות מינימום חייבת להיות לפחות 1' };
        }
        if (tier.unitPrice < 0) {
            return { valid: false, message: 'מחיר ליחידה לא יכול להיות שלילי' };
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
    return result.tiers.map((t) => ({
        minQuantity: t.min,
        maxQuantity: t.max,
        unitPrice: t.unitPrice,
    }));
}
