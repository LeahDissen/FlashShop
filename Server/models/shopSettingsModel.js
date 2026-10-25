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
        /** The shop owner's alerts by email: a new order, a new message from the site's contact form */
        notifications: {
            email: { type: String, default: "" },
            newOrder: { type: Boolean, default: true },
            newMessage: { type: Boolean, default: true },
        },
        /** The shop closed to the public (while it is being set up): visitors see a "coming soon" page, the admin sees everything */
        siteClosed: { type: Boolean, default: false },
        /** The text visitors see while the shop is closed (empty = a default text) */
        closedMessage: { type: String, default: "" },
        /** Where customers' replies to the site's emails go (empty = to the sending address) */
        replyToEmail: { type: String, default: "" },
    },
    { timestamps: true },
);

exports.ShopSettingsModel = mongoose.model("ShopSettings", shopSettingsSchema);
