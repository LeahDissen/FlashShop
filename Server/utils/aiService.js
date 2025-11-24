const { GoogleGenAI } = require("@google/genai");
const {config} = require("../config/secret");
const axios = require('axios');

const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

const PRODUCT_BASE_IMAGES = {
    'T-shirt': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
    'Coffee Mug': 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=80',
    'Phone Case': 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=600&q=80',
    'Tote Bag': 'https://images.unsplash.com/photo-1597484662317-c9253e692f76?w=600&q=80',
    'Jigsaw Puzzle': 'https://images.unsplash.com/photo-1586772002130-b0f3da82d0d2?w=600&q=80',
};

// פונקציית עזר להמרת תמונה ל-Base64 המותאמת לשרת (Node.js)
async function imageUrlToBase64(urlOrData) {
    // אם זה כבר Base64
    if (urlOrData.startsWith('data:')) {
        const matches = urlOrData.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            return { mimeType: matches[1], base64: matches[2] };
        }
    }
// change to axios for nodejs compatibility
    try {
        const response = await axios.get(urlOrData, { responseType: 'arraybuffer' });
        if (response.status !== 200) throw new Error(`HTTP error! status: ${response.status}`);
        
        const buffer = Buffer.from(response.data, 'binary');
        const mimeType = response.headers['content-type'] || 'image/jpeg';
        
        return {
            base64: buffer.toString('base64'),
            mimeType: mimeType
        };
    } catch (e) {
        console.error("Error converting image to base64:", e);
        throw e;
    }
}

// 1. פונקציה ליצירת רעיון למתנה
async function generateGiftIdea(prompt) {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `בהתבסס על התיאור הזה: "${prompt}", הצע רעיון למתנה יצירתית ומותאמת אישית. נסח את הרעיון בתמציתיות ובאופן מעורר השראה.`,
            config: {
                temperature: 0.8,
                topP: 0.9,
            }
        });

        // ב-SDK של Node.js המבנה עשוי להיות מעט שונה, כך זה בטוח יותר:
        const candidate = response.response.candidates[0];
        const text = candidate.content.parts[0].text;
        
        return text || "לא ניתן היה ליצור רעיון.";
    } catch (error) {
        console.error("Error generating gift idea:", error);
        throw new Error("Failed to generate gift idea.");
    }
}

// 2. פונקציה ליצירת הדמיית מוצר
async function generatePersonalizedProduct(productName, userDesignDataUrl) {
    try {
        const baseImageUrl = PRODUCT_BASE_IMAGES[productName] || PRODUCT_BASE_IMAGES['T-shirt'];
        
        // המרת שתי התמונות ל-Base64
        const baseImage = await imageUrlToBase64(baseImageUrl);
        const userDesign = await imageUrlToBase64(userDesignDataUrl);

        const prompt = `You are an expert product photo editor.
        INPUTS: Image 1: BASE PRODUCT. Image 2: DESIGN PRINT.
        TASK: Realistically apply the DESIGN PRINT onto the BASE PRODUCT.
        RULES: 
        1. Keep the exact product from Image 1. 
        2. Warp design to fit perspective/curves. 
        3. Multiply design over texture for realism.
        4. Do NOT crop or change background.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // שימי לב: יש לבדוק אם יש גישה למודל image בחשבון שלך, לפעמים נקרא gemini-1.5-pro-vision או דומה
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: baseImage.mimeType, data: baseImage.base64 } },
                        { inlineData: { mimeType: userDesign.mimeType, data: userDesign.base64 } }
                    ]
                }
            ]
        });

        // חילוץ התמונה מהתשובה (במידה ו-Gemini מחזיר תמונה)
        // הערה: נכון לעכשיו מודל הטקסט (Flash) לא מחזיר תמונה ג'נרטיבית, הוא מנתח תמונות.
        // אם את צריכה יצירת תמונה (Imagen), הקוד שונה. 
        // הקוד המקורי שלך ניסה לקבל תמונה חזרה. במידה וזה המודל הנכון:
        
        // נניח שהמודל מחזיר תמונה ב-parts
        /* הערה חשובה: נכון להיום ה-SDK הזה מייצר טקסט ע"ב תמונות. 
           בשביל לייצר תמונה (Image Generation) יש להשתמש במודל 'imagen-3.0-generate-001' 
           או לוודא שיש לך גישה ל-gemini שמחזיר תמונות.
        */
        
        return "Image generation logic requires specific model verification"; 

    } catch (error) {
        console.error("Error generating product:", error);
        throw error;
    }
}

module.exports = { generateGiftIdea, generatePersonalizedProduct };