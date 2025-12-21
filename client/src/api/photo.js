import axios from 'axios';
const API_URL = `${import.meta.env.VITE_MONGO_API}/photo-prices`;

export const getPhotoPrices = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};