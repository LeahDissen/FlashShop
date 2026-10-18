/**
 * Sale details for display: returned only when the product is marked on sale and the original price is higher than the current price.
 * @returns {{ originalPrice: number, savedAmount: number, percentOff: number } | null}
 */
export function getSaleInfo(product) {
    const price = Number(product?.price);
    const originalPrice = Number(product?.originalPrice);
    if (!product?.isOnSale || !Number.isFinite(price) || !Number.isFinite(originalPrice) || originalPrice <= price) {
        return null;
    }
    const savedAmount = originalPrice - price;
    return { originalPrice, savedAmount, percentOff: Math.round((savedAmount / originalPrice) * 100) };
}
