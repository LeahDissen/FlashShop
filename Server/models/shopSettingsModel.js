const mongoose = require("mongoose");

/**
 * הגדרות חנות יחידות (singleton) — קישור תשלום חיצוני ועוד.
 * המנהלת עורכת את הקישור בפאנל הניהול בלי שינוי קוד.
 */
const shopSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        paymentLinkUrl: { type: String, default: "", trim: true },
    },
    { timestamps: true },
);

exports.ShopSettingsModel = mongoose.model("ShopSettings", shopSettingsSchema);
