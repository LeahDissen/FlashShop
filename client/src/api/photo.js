import axios from 'axios';
import { MONGO_API } from '../config/api';
const API_URL = `${MONGO_API}/photo-prices`;

export const getPhotoPrices = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};