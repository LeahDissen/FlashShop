/**
 * פרטי מבצע להצגה: מוחזר רק כשהמוצר מסומן במבצע והמחיר המקורי גבוה מהמחיר הנוכחי.
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
