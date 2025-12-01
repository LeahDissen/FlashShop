const axios = require('axios');
const sharp = require('sharp');

const newMugUrl = 'https://res.cloudinary.com/dwqywo11u/image/upload/v1764152939/%D7%A6%D7%99%D7%9C%D7%95%D7%9D_%D7%9E%D7%A1%D7%9A_2025-11-26_122824_qyv5r9.png';

async function checkDimensions() {
    try {
        const response = await axios.get(newMugUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const metadata = await sharp(buffer).metadata();
        console.log(`New Mug Dimensions: ${metadata.width}x${metadata.height}`);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkDimensions();
