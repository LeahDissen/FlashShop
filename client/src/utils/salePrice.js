/**
 * Club members' price for display (sales are members-only): the regular price stays the product price,
 * and members pay this at checkout. Returned only when the product has a member discount.
 * @returns {{ memberPrice: number, savedAmount: number, percentOff: number } | null}
 */
export function getSaleInfo(product) {
    const price = Number(product?.price);
    const rule = product?.memberDiscount;
    const value = Number(rule?.value);
    if (!rule?.type || !Number.isFinite(price) || price <= 0 || !Number.isFinite(value)) return null;
    const memberPrice = rule.type === 'percent'
        ? price * (1 - Math.min(100, Math.max(0, value)) / 100)
        : Math.max(0, Math.min(price, value));
    const savedAmount = price - memberPrice;
    if (savedAmount <= 0) return null;
    return { memberPrice: Math.round(memberPrice * 100) / 100, savedAmount, percentOff: Math.round((savedAmount / price) * 100) };
}
