import axios from "axios";

const API_URL = "http://localhost:5000/club";

export const joinClubRequest = async (userData) => {
    const response = await axios.post(`${API_URL}/join`, userData);
    console.log("api is correct: " + response.data);
    return response.data;
};
export const checkCouponRequest = async (code, userId) => {
    try {
        // Pass userId as a query parameter
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
export const sendBroadcastEmail = async (formData) => {
    const response = await axios.post(`${API_URL}/broadcast`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
    });
    return response.data;
};