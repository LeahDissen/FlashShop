import axios from 'axios';
import { MONGO_API } from '../config/api';

const API_URL = `${MONGO_API}/photo-prices`;

/** Photo development price list: { sizes, quantityTiers, albumDiscountTiers } */
export const getPhotoPricing = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const updatePhotoPricing = async (pricing) => {
    const response = await axios.put(API_URL, pricing, { withCredentials: true });
    return response.data;
};
