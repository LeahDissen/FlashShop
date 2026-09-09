/**
 * הרצה: node seedEditorAssets.js
 * מזין את רכיבי עורך העיצוב העצמי הקיימים בקוד (פעם אחת, לפי seedKey).
 */
const mongoose = require("mongoose");
const { config } = require("./config/secret");
const { upsertDefaultAssets } = require("./controllers/editorAssetsController");

async function seed() {
    if (!config.MONGO_URL) {
        console.error("חסר MONGO_URL בקובץ .env");
        process.exit(1);
    }

    await mongoose.connect(config.MONGO_URL);
    const result = await upsertDefaultAssets();
    console.log(`Editor assets seed: inserted=${result.inserted}, already existed=${result.unchanged}, total=${result.total}`);
    await mongoose.disconnect();
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
