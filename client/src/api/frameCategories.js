import axios from "axios";

import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/frame-categories`;

export const getFrameCategories = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createFrameCategory = async (data) => {
    const response = await axios.post(API_URL, data, { withCredentials: true });
    return response.data;
};

export const updateFrameCategory = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
    return response.data;
};

export const deleteFrameCategory = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};
