const sharp = require('sharp');
const axios = require('axios');

// הגדרות מותאמות למוצרים החדשים שלך
const PRODUCT_CONFIG = {
    // --- ביגוד (Apparel) ---
    'T-shirt': {
        url: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
        scale: 0.25,  // לוגו בגודל בינוני
        topPct: 0.38, // ממוקם באזור החזה (קצת מתחת לצווארון)
    },
    'Hoodie': {
        url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
        scale: 0.28,
        topPct: 0.35, // מרכז חזה בקפוצ'ון
    },
    'Baseball Cap': {
        url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop',
        scale: 0.18,  // לוגו קטן יותר כי זה כובע
        topPct: 0.45, // מרכז הכובע (אנכית)
    },

    // --- שתייה (Drinkware) ---
    'Coffee Mug': {
        url: 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop',
        scale: 0.25,
        topPct: 0.50, // מרכז הכוס
    },
    'Travel Tumbler': {
        url: 'https://images.unsplash.com/photo-1596483569424-9b87053e160a?w=600&q=80',
        scale: 0.25,
        topPct: 0.50,
    },

    // --- אביזרים (Accessories) ---
    'Tote Bag': {
        url: 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80',
        scale: 0.35,  // שטח הדפסה גדול
        topPct: 0.55, // ממוקם קצת נמוך יותר בתיק צד
    },
    'Phone Case': {
        url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
        scale: 0.35,
        topPct: 0.40, // בחלק העליון-מרכזי כדי לא להסתיר עם היד
    },

    // --- שונות (Stationery/Fun) ---
    'Notebook': {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
        scale: 0.40,
        topPct: 0.45,
    },
    'Jigsaw Puzzle': {
        // הערה: החלפתי לקישור Unsplash שעובד בטוח, כי הקישור ל-Vecteezy היה לדף אינטרנט ולא לתמונה
        url: 'https://plus.unsplash.com/premium_photo-1664113038676-e41c46342894?w=600&q=80', 
        scale: 0.60,  // פאזל מקבל הדפסה גדולה על כל השטח
        topPct: 0.50,
    },
    'Heart Puzzle': {
        // גם כאן, אם יש לך קישור ישיר לתמונה (JPG) תחליף את ה-URL הזה
        url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80', // תמונה זמנית של לב
        scale: 0.40,
        topPct: 0.50,
    },

    // ברירת מחדל (Fallback)
    'default': {
        url: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872',
        scale: 0.3,
        topPct: 0.5,
    }
};

async function fetchImageBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error(`Failed to fetch image from ${url}`, error.message);
        throw new Error("Could not load product base image");
    }
}

async function generatePersonalizedProduct(productName, userDesignDataUrl) {
    try {
        // 1. שליפת ההגדרות
        const config = PRODUCT_CONFIG[productName] || PRODUCT_CONFIG['default'];
        
        const baseBuffer = await fetchImageBuffer(config.url);
        
        // המרת ה-Base64 של העיצוב ל-Buffer
        // תמיכה בפורמטים שונים של דאטה-יורל
        const base64Data = userDesignDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const designBuffer = Buffer.from(base64Data, 'base64');

        // קבלת מימדים
        const baseMetadata = await sharp(baseBuffer).metadata();
        
        // 2. חישוב גודל
        const targetWidth = Math.round(baseMetadata.width * config.scale);
        
        // שינוי גודל הלוגו
        const resizedDesign = await sharp(designBuffer)
            .resize({ width: targetWidth })
            .toBuffer();

        const designMetadata = await sharp(resizedDesign).metadata();

        // 3. חישוב מיקום
        const leftPos = Math.round((baseMetadata.width - designMetadata.width) / 2);
        const topPos = Math.round(baseMetadata.height * config.topPct);

        // 4. הרכבה
        const finalImageBuffer = await sharp(baseBuffer)
            .composite([
                {
                    input: resizedDesign,
                    top: topPos,
                    left: leftPos,
                    blend: 'multiply' 
                }
            ])
            .toBuffer();

        return `data:image/jpeg;base64,${finalImageBuffer.toString('base64')}`;

    } catch (error) {
        console.error("Error creating mockup with Sharp:", error);
        throw new Error("Failed to generate mockup locally.");
    }
}

async function generateGiftIdea(prompt) {
    // לוגיקה קיימת...
    return "רעיון למתנה..."; 
}

module.exports = { generateGiftIdea, generatePersonalizedProduct };