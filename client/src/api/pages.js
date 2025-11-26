import axios from "axios";
const API_URL = "http://localhost:4000/api/page";

export const getPage = async (endpoint) => {
    const response = await axios.get(`${API_URL}/${endpoint}`);
    return response.data;
};

export const updatePage = async (endpoint, data) => {
    const response = await axios.put(`${API_URL}/${endpoint}`, data);
    return response.data;
};