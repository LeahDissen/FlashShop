const mongoose = require("mongoose");

/**
 * Single shop settings document (singleton) — external payment link and more.
 * The admin edits the link in the admin panel without a code change.
 */
const shopSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        paymentLinkUrl: { type: String, default: "", trim: true },
    },
    { timestamps: true },
);

exports.ShopSettingsModel = mongoose.model("ShopSettings", shopSettingsSchema);
