import axios from 'axios';
import { MONGO_API } from '../config/api';
const API_URL = `${MONGO_API}/products`;

export const getProducts = async () => {
    const response = await axios.get(API_URL);
    return response.data;
}

export const getProductById = async (productId) => {
    const response = await axios.get(`${API_URL}/${productId}`);
    return response.data;
}

export const getProductImage = async (productId) => {
    const response = await axios.get(`${API_URL}/${productId}/image`, {
        responseType: 'blob'
    });
    return response.data;
}

export const addProduct = async (productData) => {
    const response = await axios.post(API_URL, productData, { withCredentials: true });
    return response.data;
};

export const updateProduct = async (productId, productData) => {
    const response = await axios.put(`${API_URL}/${productId}`, productData, {
        withCredentials: true,
    });
    return response.data;
};

export const deleteProduct = async (productId) => {
    const response = await axios.delete(`${API_URL}/${productId}`, { withCredentials: true });
    return response.data;
};
