import axios from "axios";

import { MONGO_API } from "../config/api";
const API_URL = `${MONGO_API}/editor-settings`;

export const getEditorSettings = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const updateEditorSettings = async (data) => {
    const response = await axios.put(API_URL, data, { withCredentials: true });
    return response.data;
};
