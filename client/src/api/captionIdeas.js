import axios from "axios";

import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/caption-ideas`;

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
