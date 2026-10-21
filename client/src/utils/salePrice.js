import { getUnitPriceForQuantity } from './productQuantityPricing';

/**
 * The price a customer pays for one unit: the quantity tier for one unit when the product has tiers
 * (the server prices orders the same way), otherwise the product price.
 */
export const regularUnitPrice = (product) => getUnitPriceForQuantity(product, 1);

/**
 * Club members' price for display (sales are members-only): members pay this at checkout, against the
 * regular price for one unit. Returned only when members really pay less – the server applies the
 * member discount to the tier price, so a tier that is already at the members' price gives no discount.
 * @returns {{ regularPrice: number, memberPrice: number, savedAmount: number, percentOff: number } | null}
 */
export function getSaleInfo(product) {
    const price = Number(regularUnitPrice(product));
    const rule = product?.memberDiscount;
    const value = Number(rule?.value);
    if (!rule?.type || !Number.isFinite(price) || price <= 0 || !Number.isFinite(value)) return null;
    const memberPrice = rule.type === 'percent'
        ? price * (1 - Math.min(100, Math.max(0, value)) / 100)
        : Math.max(0, Math.min(price, value));
    const savedAmount = price - memberPrice;
    if (savedAmount <= 0) return null;
    return {
        regularPrice: price,
        memberPrice: Math.round(memberPrice * 100) / 100,
        savedAmount,
        percentOff: Math.round((savedAmount / price) * 100),
    };
}
