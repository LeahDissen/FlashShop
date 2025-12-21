import axios from 'axios';
const API_URL = `${import.meta.env.VITE_MONGO_API}/orders`;

export const saveCartToDB = async (userId, cartItems) => {
    if (!userId || cartItems.length === 0) return;

    const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    try {
        await axios.put(`${API_URL}/pending/user/${userId}`, {
            items: cartItems,
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