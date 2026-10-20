/**
 * Club member discounts, calculated on the server from verified prices only.
 * Pure functions: the caller supplies the products, the member and the settings.
 */

const round2 = (value) => Math.round(value * 100) / 100;

/** Discount per unit for a { type: "percent" | "price", value } rule on a unit price */
const unitDiscount = (rule, unitPrice) => {
    const value = Number(rule?.value);
    if (!rule?.type || !Number.isFinite(value) || value < 0 || !(unitPrice > 0)) return 0;
    if (rule.type === "percent") return round2(unitPrice * Math.min(value, 100) / 100);
    if (rule.type === "price") return round2(Math.max(0, unitPrice - value));
    return 0;
};

/** The album discount percent for a number of prints (highest tier reached), from the photo price list */
const albumPercentFor = (tiers, totalPrints) => {
    const reached = (Array.isArray(tiers) ? tiers : [])
        .filter((tier) => totalPrints >= Number(tier.minQuantity))
        .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    return reached ? Math.min(100, Math.max(0, Number(reached.percent) || 0)) : 0;
};

const isAlbumProduct = (product) =>
    /אלבום/.test(String(product?.category || "")) || /אלבום/.test(String(product?.name || ""));

/**
 * @param {{
 *   entries: { productId: string, unitPrice: number, quantity: number, product: object }[],
 *   albumPercent: number,               // 0 when the order has too few prints
 *   gift: { productId: string, discountType: string, value: number } | null,  // the join gift, when this customer may use it
 * }} input
 * @returns {{ member: number, album: number, gift: number, giftApplied: boolean }} amounts in shekels
 */
exports.computeClubDiscounts = ({ entries, albumPercent = 0, gift = null }) => {
    let member = 0;
    let album = 0;
    let giftAmount = 0;
    let giftApplied = false;

    for (const entry of entries) {
        const memberPerUnit = unitDiscount(entry.product?.memberDiscount, entry.unitPrice);
        const albumPerUnit = albumPercent > 0 && isAlbumProduct(entry.product)
            ? round2(entry.unitPrice * albumPercent / 100)
            : 0;
        // The larger of the two per unit – discounts on the same product do not add up
        const best = Math.max(memberPerUnit, albumPerUnit);
        const fromAlbum = albumPerUnit > memberPerUnit;
        let units = entry.quantity;

        if (!giftApplied && gift && String(gift.productId) === String(entry.productId)) {
            // One unit at the gift price, when that beats the member price
            const giftPerUnit = unitDiscount({ type: gift.discountType, value: gift.value }, entry.unitPrice);
            if (giftPerUnit > best) {
                giftAmount += giftPerUnit;
                giftApplied = true;
                units -= 1;
            }
        }

        if (fromAlbum) album += best * units;
        else member += best * units;
    }

    return { member: round2(member), album: round2(album), gift: round2(giftAmount), giftApplied };
};

exports.albumPercentFor = albumPercentFor;
exports.isAlbumProduct = isAlbumProduct;
exports.unitDiscount = unitDiscount;
