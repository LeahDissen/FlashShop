import axios from 'axios';

export async function generatePersonalizedProduct(productName, userDesignDataUrl) {
  // כתובת השרת שלך (ודאי שהפורט נכון, אצלך מוגדר 4000 או 5000)
  const API_URL = "http://localhost:5000/products/generate-mockup"; 
  
  const response = await axios.post(API_URL, {
    productName,
    designImage: userDesignDataUrl
  });
  
  return response.data.result;
}