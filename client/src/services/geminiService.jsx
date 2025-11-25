import { GoogleGenAI, Modality } from "@google/genai";
const apiKey = "AIzaSyBXuB2FZAFL43NsnTP67xFUwE0FJ8KMo0o"
const ai = new GoogleGenAI({
  apiKey: apiKey
})

const PRODUCT_BASE_IMAGES = {
  // Apparel
  'T-shirt': 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // White Tee on hanger
  'Hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80', // White Hoodie flat lay
  'Baseball Cap': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // White Cap side view

  // Drinkware
  'Coffee Mug': 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', // Classic White Ceramic Mug
  'Travel Tumbler': 'https://images.unsplash.com/photo-1596483569424-9b87053e160a?w=600&q=80', // Metal/White Tumbler

  // Accessories
  'Tote Bag': 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80', // Canvas Tote Bag
  'Phone Case': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80', // iPhone Case Flat Lay

  // Stationery/Fun
  'Notebook': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80', // Spiral Notebook
  'Jigsaw Puzzle': 'https://www.vecteezy.com/photo/6660857-white-blank-jigsaw-puzzle-with-shadows-on-a-wood-floor-with-cracks-3d-rendering', // Puzzle concept
  'Heart Puzzle': 'https://www.vecteezy.com/photo/71737630-heart-shaped-jigsaw-puzzle-on-white-surface-symbolizing-love-and-connection-with-bright-lighting', // Empty Frame
};


export async function generateGiftIdea(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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

/**
 * Helper to convert URL or Data URL to Base64/MimeType object
 * @param {string} urlOrData 
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
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
    console.log(baseImage);
    console.log(baseImage.base64);
    console.log(baseImage.mimeType);


    // 2. Get User Design (Canvas output)
    const userDesign = await imageUrlToBase64(userDesignDataUrl);
    console.log(userDesign);
    console.log(userDesign.base64);
    console.log(userDesign.mimeType);

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
      model: 'gemini-2.5-flash-image-preview',
      contents: [{ parts: [baseImagePart, designImagePart, { text: prompt }] }],
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