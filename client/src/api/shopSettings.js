import axios from "axios";
import { MONGO_API } from "../config/api";

const API_URL = `${MONGO_API}/shop-settings`;

export const getShopSettings = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const updateShopSettings = async (data) => {
    const response = await axios.put(API_URL, data, { withCredentials: true });
    return response.data;
};

/** The shop owner's alert and reply-to addresses (admin only) */
export const getEmailSettings = async () => {
    const response = await axios.get(`${API_URL}/email`, { withCredentials: true });
    return response.data;
};

export const updateEmailSettings = async (data) => {
    const response = await axios.put(`${API_URL}/email`, data, { withCredentials: true });
    return response.data;
};
