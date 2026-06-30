/** תמחור מוצר לפי מדרגות כמות — שרת */

function normalizePriceTiers(tiers = []) {
    return [...tiers]
        .filter((t) => t && t.minQuantity != null && t.unitPrice != null)
        .map((t) => ({
            min: Number(t.minQuantity),
            max: t.maxQuantity == null || t.maxQuantity === '' ? null : Number(t.maxQuantity),
            unitPrice: Number(t.unitPrice),
        }))
        .filter((t) => Number.isFinite(t.min) && Number.isFinite(t.unitPrice))
        .sort((a, b) => a.min - b.min);
}

function getUnitPriceForQuantity(product, quantity) {
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

module.exports = {
    getUnitPriceForQuantity,
};
