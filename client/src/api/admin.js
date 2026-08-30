import axios from 'axios';
import { MONGO_API } from '../config/api';
const API_URL = `${MONGO_API}/catalog`;

export const uploadCatalog = async (formData) => {
    const response = await axios.post(`${API_URL}/upload-catalog`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
    });
    return response.data;
};