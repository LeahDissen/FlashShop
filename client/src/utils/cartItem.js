const OBJECT_ID_PREFIX = /^([a-f0-9]{24})-/i;

export const extractProductIdFromLineId = (lineId) => {
    if (!lineId || typeof lineId !== 'string') return undefined;
    const match = lineId.match(OBJECT_ID_PREFIX);
    return match ? match[1] : undefined;
};

export const normalizeCartItem = (item) => {
    const productId =
        item.productId ||
        item.product_id ||
        extractProductIdFromLineId(item.id);

    const { _id, ...rest } = item;
    return productId ? { ...rest, productId } : rest;
};

export const toCheckoutItem = (item) => {
    const normalized = normalizeCartItem(item);
    return {
        id: normalized.id,
        productId: normalized.productId,
        name: normalized.name,
        size: normalized.size,
        quantity: normalized.quantity,
        price: normalized.price,
        image: normalized.image,
        customDesign: normalized.customDesign,
        customization: normalized.customization,
    };
};
