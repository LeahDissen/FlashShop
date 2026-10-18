import axios from 'axios';
import { MONGO_API } from '../config/api';

const API_URL = `${MONGO_API}/products`;

/** The AI mockup is turned off on the server for now; the error carries the message to show the customer */
export async function generatePersonalizedProduct(productName, userDesignDataUrl) {
  try {
    const response = await axios.post(`${API_URL}/generate-mockup`, {
      productName,
      designImage: userDesignDataUrl
    });
    return response.data.result;
  } catch (error) {
    throw new Error(error.response?.data?.msg || 'יצירת הדמיה של המוצר עדיין לא פעילה. היא תהיה זמינה בקרוב.');
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