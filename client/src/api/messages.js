import axios from "axios";
const API_URL = `${import.meta.env.VITE_MONGO_API}/contact`;

export const sendMessageRequest = async (msgData) => {
    const response = await axios.post(API_URL, msgData);
    return response.data;
};

export const getAllMessages = async () => {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
};

export const deleteMessageRequest = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};