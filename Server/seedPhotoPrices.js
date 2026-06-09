/**
 * הרצה חד-פעמית: node seedPhotoPrices.js
 * מזין את גדלי ההדפסה הסטנדרטיים ל-DB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { PhotoPriceModel } = require('./models/photoPriceModel');

const SIZES = [
    { size: '10x15', price: 0, label: 'גודל סטנדרט — 10×15 ס"מ (6×4 אינץ\')' },
    { size: '13x18', price: 0, label: 'גודל בינוני — 13×18 ס"מ (5×7 אינץ\')' },
    { size: '15x20', price: 0, label: '15×20 ס"מ (6×8 אינץ\')' },
    { size: '21x29.7', price: 0, label: 'איי ארבע — 21×29.7 ס"מ' },
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    for (const entry of SIZES) {
        await PhotoPriceModel.findOneAndUpdate(
            { size: entry.size },
            entry,
            { upsert: true, new: true },
        );
        console.log('✓', entry.size);
    }
    await mongoose.disconnect();
    console.log('Done.');
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
