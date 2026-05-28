import axios from "axios";
const API_URL = `${import.meta.env.VITE_REDIS_API}/api/page`;

export const getPage = async (endpoint) => {
    const url = `${API_URL}/${endpoint}`;
    try {
        const response = await axios.get(url);
        const data = response?.data;
        return data && typeof data === "object" && !Array.isArray(data) ? data : {};
    } catch (error) {
        return {};
    }
};

export const updatePage = async (endpoint, data) => {
    const url = `${API_URL}/${endpoint}`;
    const response = await axios.put(url, data, { withCredentials: true });
    return response.data;
};