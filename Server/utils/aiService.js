const { spawn } = require('child_process');
const path = require('path');
const { config } = require('../config/secret');

const PRODUCT_URLS = {
    'T-shirt': 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872&auto=format&fit=crop',
    'Hoodie': 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&q=80',
    'Baseball Cap': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=600&auto=format&fit=crop',
    'Coffee Mug': 'https://images.unsplash.com/photo-1650959858546-d09833d5317b?q=80&w=600&auto=format&fit=crop',
    'Travel Tumbler': 'https://images.unsplash.com/photo-1596483569424-9b87053e160a?w=600&q=80',
    'Tote Bag': 'https://images.unsplash.com/photo-1622560417282-3f66d0d21d66?w=600&q=80',
    'Phone Case': 'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80',
    'Notebook': 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
    'Jigsaw Puzzle': 'https://plus.unsplash.com/premium_photo-1664113038676-e41c46342894?w=600&q=80',
    'Heart Puzzle': 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=80',
    'default': 'https://plus.unsplash.com/premium_photo-1718913931807-4da5b5dd27fa?q=80&w=872'
};

async function generatePersonalizedProduct(productName, userDesignDataUrl) {
    return new Promise((resolve, reject) => {
        const productUrl = PRODUCT_URLS[productName] || PRODUCT_URLS['default'];
        
        console.log(`[AI Service] Starting Smart Mockup for: ${productName}`);

        const inputData = {
            productName: productName,
            productUrl: productUrl,
            designImage: userDesignDataUrl
        };

        const scriptPath = path.join(__dirname, '../python_scripts/mockup_genai.py');
        const pythonProcess = spawn('python', [scriptPath], {
            env: { ...process.env, GEMINI_API_KEY: config.GEMINI_API_KEY }
        });

        let resultData = '';
        let errorData = '';

        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();

        pythonProcess.stdout.on('data', (data) => {
            resultData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
            console.log(`[Python Log]: ${data.toString()}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python script failed: ${errorData}`));
            }
            if (!resultData) {
                return reject(new Error("Python script returned empty result"));
            }
            console.log("✅ Mockup created successfully!");
            resolve(resultData.trim());
        });
    });
}

async function generateGiftIdea(prompt) {
    return "רעיון למתנה...";
}

module.exports = { generateGiftIdea, generatePersonalizedProduct };