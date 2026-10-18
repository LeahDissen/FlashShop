/**
 * Run: node seedEditorAssets.js
 * Seeds the self-design editor items that exist in the code (once, by seedKey).
 */
const mongoose = require("mongoose");
const { config } = require("./config/secret");
const { upsertDefaultAssets } = require("./controllers/editorAssetsController");

async function seed() {
    if (!config.MONGO_URL) {
        console.error("MONGO_URL is missing from the .env file");
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
