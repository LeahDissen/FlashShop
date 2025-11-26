import axios from "axios";
const API_URL = 'http://localhost:5000';

export const getAllTips = async () => {
    const response = await axios.get(`${API_URL}/tips`, {});
    return response;
};