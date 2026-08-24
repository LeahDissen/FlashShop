import axios from 'axios';
import { MONGO_API } from '../config/api';

const API_URL = `${MONGO_API}/products`;

export async function generatePersonalizedProduct(productName, userDesignDataUrl) {
  try {
    const response = await axios.post(`${API_URL}/generate-mockup`, {
      productName,
      designImage: userDesignDataUrl
    });
    console.log(response.data);
    return response.data.result;
  } catch (error) {
    console.error("Error generating product mockup:", error);
    throw error;
  }
}

export async function generateGiftIdea(prompt) {
   try {
    const response = await axios.post(`${API_URL}/generate-gift-idea`, { prompt });
    return response.data.result;
   } catch (error) {
     console.error("Error generating gift idea:", error);
     return "לא ניתן היה ליצור רעיון.";
   }
}