/**
 * הרצה חד-פעמית: CMS_URL=https://flashshop-redis.onrender.com node importPagesFromCms.js
 * מעתיק את תוכן הדפים משרת ה-CMS הישן (Redis) לקולקציית pages ב-Mongo.
 * בטוח להריץ שוב — כל הרצה דורסת את הדפים בערכים הנוכחיים מה-CMS.
 */
const axios = require("axios");
const mongoose = require("mongoose");
const { config } = require("./config/secret");
const { PageModel, PAGE_KEYS } = require("./models/pageModel");

const CMS_URL = (process.env.CMS_URL || "").replace(/\/$/, "");

async function importPages() {
    if (!CMS_URL) {
        throw new Error("CMS_URL is required, e.g. CMS_URL=https://flashshop-redis.onrender.com");
    }

    await mongoose.connect(config.MONGO_URL);

    for (const key of PAGE_KEYS) {
        const { data } = await axios.get(`${CMS_URL}/api/page/${key}`);
        const fields = data && typeof data === "object" && !Array.isArray(data) ? data : {};
        await PageModel.findOneAndUpdate(
            { key },
            { $set: { data: fields } },
            { upsert: true, setDefaultsOnInsert: true },
        );
        console.log(`✓ ${key} (${Object.keys(fields).length} fields)`);
    }

    await mongoose.disconnect();
    console.log("Done.");
}

importPages().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
