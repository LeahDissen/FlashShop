import axios from 'axios';
import { MONGO_API } from '../config/api';
const API_URL = `${MONGO_API}/orders`;

export const createOrder = async (orderData) => {
    const response = await axios.post(API_URL, orderData);
    return response.data;
}
export const getPendingOrderForUser = async (userId) => {
    const response = await axios.get(`${API_URL}/pending/user/${userId}`);
    return response.data;
}
export const getUserOrders = async (userId) => {
    const response = await axios.get(`${API_URL}/user/${userId}`);
    return response.data;
}
export const getOrders = async () => {
    const response = await axios.get(API_URL);
    return response.data;
}
export const updateOrder = async (userId, updatedData) => {
    const response = await axios.put(`${API_URL}/pending/user/${userId}`, updatedData);
    return response.data;
}
export const updateOrderStatus = async (orderId, statusData) => {
    const response = await axios.put(`${API_URL}/${orderId}/status`, statusData);
    return response.data;
}
export const getOrderById = async (orderId) => {
    const response = await axios.get(`${API_URL}/${orderId}`);
    return response.data;
}

export const syncOrderDrive = async (orderId) => {
    const response = await axios.post(`${API_URL}/${orderId}/drive`);
    return response.data;
}