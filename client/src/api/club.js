import axios from "axios";
const API_URL = `${import.meta.env.VITE_MONGO_API}/club`;

export const joinClubRequest = async (userData) => {
    const response = await axios.post(`${API_URL}/join`, userData);
    console.log("api is correct: " + response.data);
    return response.data;
};
export const checkCouponRequest = async (code, userId) => {
    try {
        const url = userId 
            ? `${API_URL}/check/${code}?userId=${userId}`
            : `${API_URL}/check/${code}`;
            
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Coupon check failed", error);
        return { valid: false, msg: "שגיאה בבדיקת הקופון" };
    }
};
export const getClubMembers = async () => {
    const response = await axios.get(`${API_URL}/members`, { withCredentials: true });
    return response.data;
};

export const sendBroadcastEmail = async (formData) => {
    const response = await axios.post(`${API_URL}/broadcast`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
    });
    return response.data;
};