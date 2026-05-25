const axios = require('axios');
const sharp = require('sharp');

const PRODUCT_URLS = {
    'FlashShop Classic T-Shirt': 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
    'T-shirt': 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
    'Hoodie with Print': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
    'Hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
    'Photo Print Tote Bag': 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80',
    'Tote Bag': 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80',
    'Custom Phone Case': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
    'Phone Case': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
    'Travel Mug': 'https://images.unsplash.com/photo-1596483569424-9b87053e160a?w=600&q=80',
    'Personalized Mug': 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop',
    'Coffee Mug': 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop',
    'Canvas Wall Art': 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80',
    'Photo Puzzle': 'https://plus.unsplash.com/premium_photo-1664113038676-e41c46342894?w=600&q=80',
    'Custom Notebook': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
    'Notebook': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
    default: 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
};

/** אזור הדפסה ברירת מחדל (אחוזים) לפי סוג מוצר */
const PRINT_AREAS = {
    'Phone Case': { top: 25, left: 20, width: 60, height: 55 },
    'Mug': { top: 35, left: 25, width: 50, height: 45 },
    'T-shirt': { top: 28, left: 28, width: 44, height: 40 },
    'Hoodie': { top: 30, left: 28, width: 44, height: 38 },
    'Tote Bag': { top: 30, left: 25, width: 50, height: 45 },
    'Canvas': { top: 15, left: 15, width: 70, height: 70 },
    'Notebook': { top: 20, left: 20, width: 60, height: 60 },
    default: { top: 30, left: 30, width: 40, height: 40 },
};

function resolveProductUrl(productName) {
    if (!productName) return PRODUCT_URLS.default;
    if (PRODUCT_URLS[productName]) return PRODUCT_URLS[productName];

    const lower = productName.toLowerCase();
    const matchedKey = Object.keys(PRODUCT_URLS).find(
        (key) => key !== 'default' && lower.includes(key.toLowerCase())
    );
    return matchedKey ? PRODUCT_URLS[matchedKey] : PRODUCT_URLS.default;
}

function resolvePrintArea(productName) {
    const lower = (productName || '').toLowerCase();
    if (lower.includes('phone')) return PRINT_AREAS['Phone Case'];
    if (lower.includes('mug') || lower.includes('tumbler')) return PRINT_AREAS.Mug;
    if (lower.includes('hoodie')) return PRINT_AREAS.Hoodie;
    if (lower.includes('tote') || lower.includes('bag')) return PRINT_AREAS['Tote Bag'];
    if (lower.includes('canvas') || lower.includes('art')) return PRINT_AREAS.Canvas;
    if (lower.includes('shirt') || lower.includes('tee')) return PRINT_AREAS['T-shirt'];
    if (lower.includes('notebook') || lower.includes('calendar')) return PRINT_AREAS.Notebook;
    return PRINT_AREAS.default;
}

async function loadImageBuffer(source, label = 'image') {
    if (!source) throw new Error(`${label} is empty`);

    const trimmed = String(source).trim();
    if (trimmed.startsWith('http')) {
        const response = await axios.get(trimmed, {
            responseType: 'arraybuffer',
            timeout: 20000,
            headers: { 'User-Agent': 'FlashShop/1.0' },
        });
        return Buffer.from(response.data);
    }

    let base64 = trimmed;
    if (base64.includes(',')) base64 = base64.split(',')[1];
    return Buffer.from(base64, 'base64');
}

async function generateWithSharp(productName, userDesignDataUrl) {
    const productUrl = resolveProductUrl(productName);
    const area = resolvePrintArea(productName);

    console.log(`[AI Service] Sharp mockup for: ${productName}`);

    const baseBuffer = await loadImageBuffer(productUrl, 'Product image');
    const designBuffer = await loadImageBuffer(userDesignDataUrl, 'Design image');

    const baseMeta = await sharp(baseBuffer).metadata();
    const imgW = baseMeta.width;
    const imgH = baseMeta.height;

    const targetW = Math.max(1, Math.round(imgW * (area.width / 100)));
    const targetH = Math.max(1, Math.round(imgH * (area.height / 100)));
    const targetX = Math.round(imgW * (area.left / 100));
    const targetY = Math.round(imgH * (area.top / 100));

    const resizedDesign = await sharp(designBuffer)
        .resize(targetW, targetH, { fit: 'inside' })
        .png()
        .toBuffer();

    const designMeta = await sharp(resizedDesign).metadata();
    const pasteX = targetX + Math.floor((targetW - designMeta.width) / 2);
    const pasteY = targetY + Math.floor((targetH - designMeta.height) / 2);

    const outputBuffer = await sharp(baseBuffer)
        .composite([{ input: resizedDesign, left: pasteX, top: pasteY }])
        .jpeg({ quality: 90 })
        .toBuffer();

    return `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
}

async function generatePersonalizedProduct(productName, userDesignDataUrl) {
    try {
        const result = await generateWithSharp(productName, userDesignDataUrl);
        console.log('✅ Mockup created successfully!');
        return result;
    } catch (error) {
        console.error('[AI Service] Mockup failed:', error.message);
        throw new Error(`Mockup generation failed: ${error.message}`);
    }
}

async function generateGiftIdea(prompt) {
    return "רעיון למתנה...";
}

module.exports = { generateGiftIdea, generatePersonalizedProduct };
