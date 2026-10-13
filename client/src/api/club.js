import axios from "axios";
import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/club`;

export const joinClubRequest = async (userData) => {
    const response = await axios.post(`${API_URL}/join`, userData);
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
        withCredentials: true,
    });
    return response.data;
};

export const addClubMember = async (member) => {
    const response = await axios.post(`${API_URL}/members`, member, { withCredentials: true });
    return response.data;
};

export const deleteClubMember = async (id) => {
    const response = await axios.delete(`${API_URL}/members/${id}`, { withCredentials: true });
    return response.data;
};
