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
export const deleteOrders = async (ids) => {
    const response = await axios.delete(API_URL, { data: { ids } });
    return response.data;
}

export const syncOrderDrive = async (orderId) => {
    const response = await axios.post(`${API_URL}/${orderId}/drive`);
    return response.data;
}

export const getOrderEmailTemplates = async () => {
    const response = await axios.get(`${API_URL}/email-templates`);
    return response.data;
}
export const updateOrderEmailTemplate = async (status, data) => {
    const response = await axios.put(`${API_URL}/email-templates/${status}`, data);
    return response.data;
}

/** After returning from the payment page: the server verifies with Hyp and moves the order to processing */
export const confirmOrderPayment = async (orderId, redirectQuery) => {
    const response = await axios.post(`${API_URL}/${orderId}/payment/confirm`, { query: redirectQuery });
    return response.data;
};
