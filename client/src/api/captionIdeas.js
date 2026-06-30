import axios from "axios";

const API_URL = `${import.meta.env.VITE_MONGO_API}/caption-ideas`;

export const getCaptionIdeas = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createCaptionIdea = async (data) => {
    const response = await axios.post(API_URL, data, { withCredentials: true });
    return response.data;
};

export const deleteCaptionIdea = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};
