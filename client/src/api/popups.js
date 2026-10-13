import axios from "axios";
import { MONGO_API } from "../config/api";

const API_URL = `${MONGO_API}/popups`;

export const getActivePopups = async (path) => {
    const response = await axios.get(`${API_URL}/active`, { params: { path } });
    return response.data;
};

export const getAllPopups = async () => {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
};

export const createPopup = async (data) => {
    const response = await axios.post(API_URL, data, { withCredentials: true });
    return response.data;
};

export const updatePopup = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data, { withCredentials: true });
    return response.data;
};

export const deletePopup = async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`, { withCredentials: true });
    return response.data;
};
