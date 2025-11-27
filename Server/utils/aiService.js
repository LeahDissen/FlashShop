const sharp = require('sharp');
const axios = require('axios');

const PRODUCT_CONFIG = {
    // --- ביגוד ---
    'T-shirt': {
        url: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
        printArea: { width: 280, height: 350, top: 320, left: 296 }
    },
    'Hoodie': {
        url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
        printArea: { width: 200, height: 250, top: 220, left: 200 }
    },
    // --- אביזרים ---
    'Tote Bag': {
        url: 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80',
        printArea: { width: 220, height: 280, top: 300, left: 190 }
    },
    'Phone Case': {
        url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
        printArea: { width: 180, height: 320, top: 160, left: 210 }
    },

    // --- שונות ---
    'Notebook': {
        url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
        printArea: { width: 230, height: 320, top: 210, left: 185 }
    },
    'Jigsaw Puzzle': {
        url: 'https://plus.unsplash.com/premium_photo-1664113038676-e41c46342894?w=600&q=80',
        printArea: { width: 380, height: 280, top: 110, left: 110 }
    },
    'Heart Puzzle': {
        url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80',
        printArea: { width: 220, height: 220, top: 210, left: 190 }
    },

    // ברירת מחדל
    'default': {
        url: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872',
        printArea: { width: 300, height: 300, top: 300, left: 286 }
    }
};

async function fetchImageBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        const base64Data = userDesignDataUrl.replace(/^data:image\/\w+;base64,/, "");
        const designBuffer = Buffer.from(base64Data, 'base64');

        // 2. עיבוד העיצוב (ללא trim!)
        // שינוי גודל כדי שיתאים לאזור ההדפסה (מכיל את הכל)
        let resizedDesign = await sharp(designBuffer)
            .resize({
                width: printArea.width,
                height: printArea.height,
                fit: 'fill', // מותח כדי למלא את כל השטח (פותר בעיית רווחים)
                background: { r: 0, g: 0, b: 0, alpha: 0 } // רקע שקוף אם יש רווחים
            })
            .toBuffer();

        // החלת מסכה (אם מוגדרת) - לעיגול פינות
        if (config.mask) {
            resizedDesign = await sharp(resizedDesign)
                .composite([{ input: config.mask, blend: 'dest-in' }])
                .toBuffer();
        }

        // 3. הרכבה
        console.log(`   [AI Service] Compositing image...`);
        const finalImageBuffer = await sharp(baseBuffer)
            .composite([
                {
                    input: resizedDesign,
                    top: printArea.top,
                    left: printArea.left,
                    blend: 'multiply'
                }
            ])
            .toBuffer();

        console.log(`✅ [AI Service] Mockup generated successfully!`);
        return `data:image/jpeg;base64,${finalImageBuffer.toString('base64')}`;

    } catch (error) {
        console.error("❌ [AI Service] Error creating mockup with Sharp:", error);
        throw new Error(`Failed to generate mockup: ${error.message}`);
    }
}

async function generateGiftIdea(prompt) {
    return "רעיון למתנה...";
}

module.exports = { generateGiftIdea, generatePersonalizedProduct };