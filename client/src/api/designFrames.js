import axios from "axios";

import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/design-frames`;

export const getDesignFrames = async (includeInactive = false) => {
    const response = await axios.get(API_URL, {
        params: includeInactive ? { includeInactive: "true" } : undefined,
    });
    return response.data;
};

export const createDesignFrame = async (data) => {
    const response = await axios.post(API_URL, data, { withCredentials: true });
    return response.data;
};

export const updateDesignFrame = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
    return response.data;
};

export const deleteDesignFrame = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};

export const calculateAspectRatio = async (width, height) => {
    const response = await axios.post(`${API_URL}/calculate-aspect-ratio`, { width, height });
    return response.data;
};
