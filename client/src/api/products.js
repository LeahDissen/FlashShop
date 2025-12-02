import axios from 'axios';
const API_URL = 'http://localhost:5000/products';


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

    const response = await axios.post(API_URL, productData);
    return response.data;
}
export const updateProduct = async (productId, productData) => {
    const response = await axios.put(`${API_URL}/${productId}`, productData
      
    );
    return response.data;
}
export const deleteProduct = async (productId) => {
    const response = await axios.delete(`${API_URL}/${productId}`);
    return response.data;
}
