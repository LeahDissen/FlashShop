import axios from 'axios';

const API_URL = `${import.meta.env.VITE_MONGO_API}/admin`;

export const uploadCatalog = async (formData) => {
    const response = await axios.post(`${API_URL}/upload-catalog`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
    });
    return response.data;
};