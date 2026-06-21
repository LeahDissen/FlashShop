const PRICING_TIERS = [
    { min: 500, unitPrice: 0.8 },
    { min: 200, unitPrice: 0.9 },
    { min: 100, unitPrice: 1.1 },
    { min: 40, unitPrice: 1.25 },
    { min: 1, unitPrice: 1.8 },
];

const getUnitPriceByQuantity = (totalPrints) => {
    const count = Math.max(0, Number(totalPrints) || 0);
    const tier = PRICING_TIERS.find((t) => count >= t.min);
    return tier ? tier.unitPrice : 1.8;
};

const isPhotoPrintItem = (item) =>
    item?.itemType === "photo-print" ||
    String(item?.name || "").startsWith("פיתוח תמונה");

module.exports = { getUnitPriceByQuantity, isPhotoPrintItem };
