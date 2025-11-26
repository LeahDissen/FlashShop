const sharp = require('sharp');
const axios = require('axios');

// הגדרות מותאמות למוצרים
const PRODUCT_CONFIG = {
    // --- ביגוד ---
    'T-shirt': {
        url: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
        scale: 0.25,
        topPct: 0.38, 
    },
    'Hoodie': {
        url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
        scale: 0.28,
        topPct: 0.35,
    },
    'Baseball Cap': {
        url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop',
        scale: 0.18,
        topPct: 0.45,
    },

    // --- שתייה (Drinkware) - כאן היה התיקון העיקרי ---
    'Coffee Mug': {
        url: 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop',
        scale: 0.35,  // הגדלתי מעט כדי שיראה ברור יותר
        topPct: 0.28, // שיניתי מ-0.50 ל-0.28 כדי שהעיצוב יעלה למעלה
    },
    'Travel Tumbler': {
        url: 'https://images.unsplash.com/photo-1596483569424-9b87053e160a?w=600&q=80',
        scale: 0.30,
        topPct: 0.35, // הרמתי גם כאן
    },

    // --- אביזרים ---
    'Tote Bag': {
        url: 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80',
        scale: 0.35,
        topPct: 0.45, // תיקון מיקום
    },
    'Phone Case': {
        url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
        scale: 0.35,
        topPct: 0.30, // הרמה לחלק העליון
    },

    // --- שונות ---
    'Notebook': {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
        scale: 0.40,
        topPct: 0.30,
    },
    'Jigsaw Puzzle': {
        url: 'https://plus.unsplash.com/premium_photo-1664113038676-e41c46342894?w=600&q=80', 
        scale: 0.60,
        topPct: 0.20,
    },
    'Heart Puzzle': {
        url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80',
        scale: 0.40,
        topPct: 0.30,
    },

    // ברירת מחדל
    'default': {
        url: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872',
        scale: 0.3,
        topPct: 0.3,
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
        // 1. שליפת הגדרות
        const config = PRODUCT_CONFIG[productName] || PRODUCT_CONFIG['default'];
        
        const baseBuffer = await fetchImageBuffer(config.url);
        
        const base64Data = userDesignDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const designBuffer = Buffer.from(base64Data, 'base64');

        // קבלת מימדים של תמונת הבסיס
        const baseMetadata = await sharp(baseBuffer).metadata();
        
        // 2. עיבוד העיצוב - כאן התיקון הקריטי!
        // אנחנו משתמשים ב-.trim() כדי להסיר את השוליים השקופים שהגיעו מהקנבס
        const processedDesignBuffer = await sharp(designBuffer)
            .trim() // <--- מסיר רווחים ריקים מסביב לטקסט/תמונה
            .toBuffer();

        // 3. חישוב גודל היעד
        const targetWidth = Math.round(baseMetadata.width * config.scale);
        
        // שינוי גודל העיצוב החתוך
        const resizedDesign = await sharp(processedDesignBuffer)
            .resize({ width: targetWidth })
            .toBuffer();

        const designMetadata = await sharp(resizedDesign).metadata();

        // 4. חישוב מיקום
        // מרכוז אופקי
        const leftPos = Math.round((baseMetadata.width - designMetadata.width) / 2);
        
        // מיקום אנכי - לוקח את האחוז המוגדר ומחסיר חצי מגובה העיצוב כדי למרכז אותו סביב הנקודה
        // או פשוט משתמש ב-topPct כנקודת התחלה עליונה (תלוי בהעדפה).
        // בגרסה הזו השארתי את זה פשוט (top offset), אבל שיניתי את המספרים ב-CONFIG למעלה.
        let topPos = Math.round(baseMetadata.height * config.topPct);

        // וידוא שלא חורג מהגבולות
        topPos = Math.max(0, topPos);
        
        // 5. הרכבה
        const finalImageBuffer = await sharp(baseBuffer)
            .composite([
                {
                    input: resizedDesign,
                    top: topPos,
                    left: leftPos,
                    blend: 'multiply' // משתלב יפה עם הצללים של הכוס
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
    return "רעיון למתנה..."; 
}

module.exports = { generateGiftIdea, generatePersonalizedProduct };