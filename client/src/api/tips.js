import axios from "axios";

const API_URL = "http://localhost:5000/tips";

export const getAllTips = async (page = 1, limit = 9) => {
    const response = await axios.get(API_URL, {
        params: {
            page,
            limit,
            sortBy: 'createdAt',
            order: 'desc'
        }
    });
    return response.data;
};

export const createTip = async (tipData) => {
    const response = await axios.post(API_URL, tipData);
    return response.data;
};

export const updateTip = async (id, tipData) => {
    const response = await axios.put(`${API_URL}/${id}`, tipData);
    return response.data;
};