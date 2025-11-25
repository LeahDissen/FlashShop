const { GoogleGenAI } = require("@google/genai"); // ודאי שמותקנת הגרסה העדכנית
const { config } = require("../config/secret");
const sharp = require('sharp');
const axios = require('axios');
const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

// תמונות הבסיס (אותן תמונות כמו בקלאיינט)
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





// פונקציית עזר להורדת תמונה ל-Buffer
async function fetchImageBuffer(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data);
}

async function generatePersonalizedProduct(productName, userDesignDataUrl) {
    try {
        // 1. השגת תמונת הבסיס
        const baseImageUrl = PRODUCT_BASE_IMAGES[productName] || PRODUCT_BASE_IMAGES['T-shirt'];
        const baseBuffer = await fetchImageBuffer(baseImageUrl);

        // 2. המרת העיצוב של המשתמש מ-Base64 ל-Buffer
        const base64Data = userDesignDataUrl.split(';base64,').pop();
        const designBuffer = Buffer.from(base64Data, 'base64');

        // 3. ביצוע ההרכבה (Overlay) באמצעות Sharp
        // אנחנו מקטינים מעט את העיצוב וממרכזים אותו
        const baseMetadata = await sharp(baseBuffer).metadata();
        const designMetadata = await sharp(designBuffer).metadata();
        
        // חישוב גודל ומיקום (ניתן להתאים לכל מוצר ספציפית אם רוצים)
        const targetWidth = Math.round(baseMetadata.width * 0.4); // העיצוב יהיה 40% רוחב מהמוצר
        const resizedDesign = await sharp(designBuffer)
            .resize({ width: targetWidth })
            .toBuffer();

        const finalImageBuffer = await sharp(baseBuffer)
            .composite([
                {
                    input: resizedDesign,
                    gravity: 'center', // ממקם במרכז. אפשר לשנות ל-north/south וכו'
                    blend: 'multiply'  // זה הסוד! משתלב עם הקפלים והצללים כמו הדפסה אמיתית
                }
            ])
            .toBuffer();

        // 4. החזרת התמונה כ-Base64 לקלאיינט
        return `data:image/jpeg;base64,${finalImageBuffer.toString('base64')}`;

    } catch (error) {
        console.error("Error creating mockup with Sharp:", error);
        // במקרה של שגיאה, נחזיר את העיצוב המקורי או נזרוק שגיאה
        throw new Error("Failed to generate mockup locally.");
    }
}


module.exports = {  generatePersonalizedProduct };