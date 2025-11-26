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

import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Base images for products - strictly matching the UI
const PRODUCT_BASE_IMAGES = {
    'T-shirt': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80', // Flat white tee
    'Coffee Mug': 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80', // White mug
    'Phone Case': 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&q=80', // Clean iPhone back
    'Tote Bag': 'https://images.unsplash.com/photo-1597484662317-c9253e692f76?w=600&q=80', // Beige tote
    'Jigsaw Puzzle': 'https://images.unsplash.com/photo-1586772002130-b0f3da82d0d2?w=600&q=80', // White puzzle pieces
};

export async function generateGiftIdea(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `בהתבסס על התיאור הזה: "${prompt}", הצע רעיון למתנה יצירתית ומותאמת אישית. נסח את הרעיון בתמציתיות ובאופן מעורר השראה.`,
      config: {
        temperature: 0.8,
        topP: 0.9,
      }
    });

    return response.text || "לא ניתן היה ליצור רעיון.";
  } catch (error) {
    console.error("Error generating gift idea from Gemini:", error);
    throw new Error("Failed to generate gift idea.");
  }
}

async function imageUrlToBase64(urlOrData) {
    // Handle Data URLs directly
    if (urlOrData.startsWith('data:')) {
        const matches = urlOrData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            return { mimeType: matches[1], base64: matches[2] };
        }
    }

    try {
        const response = await fetch(urlOrData);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blob = await response.blob();
        const mimeType = blob.type || 'image/jpeg';
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result;
                if (!result) {
                    reject(new Error("Failed to read blob"));
                    return;
                }
                // Split comma to get pure base64
                const base64 = result.split(',')[1];
                resolve({ base64, mimeType });
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error converting image to base64:", e);
        throw e;
    }
}

export async function generatePersonalizedProduct(productName, userDesignDataUrl) {
    try {
        // 1. Get Base Image for the specific product
        const baseImageUrl = PRODUCT_BASE_IMAGES[productName] || PRODUCT_BASE_IMAGES['T-shirt'];
        const baseImage = await imageUrlToBase64(baseImageUrl);

        // 2. Get User Design (Canvas output)
        const userDesign = await imageUrlToBase64(userDesignDataUrl);

        // 3. Create Prompt
        const baseImagePart = {
            inlineData: {
                data: baseImage.base64,
                mimeType: baseImage.mimeType,
            },
        };

        const designImagePart = {
            inlineData: {
                data: userDesign.base64,
                mimeType: userDesign.mimeType,
            },
        };

        const prompt = `You are an expert product photo editor.
        
        INPUTS:
        Image 1: The "BASE PRODUCT".
        Image 2: The "DESIGN PRINT".
        
        TASK:
        Realistically apply the DESIGN PRINT (Image 2) onto the BASE PRODUCT (Image 1).
        
        STRICT RULES:
        1. IDENTITY: You must output the exact same product shown in Image 1. Do not generate a new T-shirt or Mug. Use the pixels from Image 1 as the background and subject.
        2. PLACEMENT: Warping and perspective match the design onto the product's surface (e.g., curve it around the mug, fold it on the shirt).
        3. REALISM: Multiply the design over the texture of the product so it looks like ink on fabric/material.
        4. INTEGRITY: Do not crop or change the angle of the Base Product. Keep the background exactly as is.
        
        For ${productName}, apply the design to the main printable area.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [baseImagePart, designImagePart, { text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                const base64ImageBytes = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("No image was generated.");

    } catch (error) {
        console.error("Error generating personalized product:", error);
        throw new Error("Failed to generate personalized product.");
    }
}