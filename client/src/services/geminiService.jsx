// import axios from 'axios';

// export async function generatePersonalizedProduct(productName, userDesignDataUrl) {
//   // כתובת השרת שלך (ודאי שהפורט נכון, אצלך מוגדר 4000 או 5000)
//   const API_URL = "http://localhost:5000/products/generate-mockup"; 
  
//   const response = await axios.post(API_URL, {
//     productName,
//     designImage: userDesignDataUrl
//   });
  
//   return response.data.result;
// }
import axios from 'axios';

// כתובת השרת שלך
const API_URL = "http://localhost:5000/products"; 

export async function generatePersonalizedProduct(productName, userDesignDataUrl) {
  try {
    // קריאה אחת לשרת שמבצעת את כל התהליך
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

// פונקציה זו גם יכולה לעבור דרך השרת אם תרצה, כרגע השארתי אותה כפי שהיא או שניתן לחבר גם אותה
export async function generateGiftIdea(prompt) {
   // אם תרצה שגם זה יעבור דרך השרת (מומלץ כדי להסתיר את ה-API Key),
   // תצטרך להוסיף ראוט מתאים בשרת. כרגע זה נשאר צד לקוח אם לא תשנה.
   // אבל כדי "לנקות" את הקובץ הזה, עדיף שגם זה יעבור לשרת:
   try {
    const response = await axios.post(`${API_URL}/generate-gift-idea`, { prompt });
    return response.data.result;
   } catch (error) {
     console.error("Error generating gift idea:", error);
     return "לא ניתן היה ליצור רעיון.";
   }
}