import axios from 'axios';
const API_URL = `${import.meta.env.VITE_MONGO_API}/orders`;
const MAX_IMAGE_LENGTH_FOR_SYNC = 500_000;

const compactCartItemForSync = (item) => {
    const compactCustomDesign = item?.customDesign
        ? {
            projectId: item.customDesign.projectId,
            projectName: item.customDesign.projectName,
            canvasSize: item.customDesign.canvasSize,
            printSizeCm: item.customDesign.printSizeCm,
        }
        : undefined;

    const imageForSync =
        typeof item?.image === 'string' &&
            item.image.startsWith('data:') &&
            item.image.length > MAX_IMAGE_LENGTH_FOR_SYNC
            ? null
            : item?.image ?? null;

    return {
        id: item.id,
        productId: item.productId || item.product_id || undefined,
        itemType: item.itemType,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        image: imageForSync,
        customDesign: compactCustomDesign,
        customization: item.customization?.type
            ? { type: item.customization.type }
            : undefined,
    };
};

export const saveCartToDB = async (userId, cartItems) => {
    if (!userId) return;

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const compactItems = cartItems.map(compactCartItemForSync);

    try {
        await axios.put(`${API_URL}/pending/user/${userId}`, {
            items: compactItems,
            total_price: totalPrice
        });
    } catch (error) {
        console.error("Failed to sync cart:", error);
    }
};

export const fetchCartFromDB = async (userId) => {
    if (!userId) return [];
    try {
        const response = await axios.get(`${API_URL}/pending/user/${userId}`);
        return (response.data && response.data.length > 0) ? response.data[0].items : [];
    } catch (error) {
        console.error("Failed to fetch cart:", error);
        return [];
    }
};