import axios from "axios";

import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/editor-assets`;

export const getEditorAssets = async (includeInactive = false, category) => {
    const params = {};
    if (includeInactive) params.includeInactive = "true";
    if (category) params.category = category;
    const response = await axios.get(API_URL, { params });
    return response.data;
};

export const createEditorAsset = async (data) => {
    const response = await axios.post(API_URL, data, { withCredentials: true });
    return response.data;
};

export const updateEditorAsset = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
    return response.data;
};

export const deleteEditorAsset = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};
