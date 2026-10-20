const mongoose = require("mongoose");

/**
 * Single shop settings document (singleton) — external payment link and more.
 * The admin edits the link in the admin panel without a code change.
 */
const shopSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        paymentLinkUrl: { type: String, default: "", trim: true },
        /** Join gift: a product new club members get at a discount (100% = free), once, with an emailed code */
        clubGift: {
            enabled: { type: Boolean, default: false },
            productId: { type: String, default: "" },
            discountType: { type: String, enum: ["percent", "price"], default: "percent" },
            value: { type: Number, default: 100 },
            emailSubject: { type: String, default: "" },
            emailBody: { type: String, default: "" },
        },
        /** Shown at checkout to a customer who is not a club member while member discounts apply to her cart */
        notMemberText: { type: String, default: "" },
    },
    { timestamps: true },
);

exports.ShopSettingsModel = mongoose.model("ShopSettings", shopSettingsSchema);
