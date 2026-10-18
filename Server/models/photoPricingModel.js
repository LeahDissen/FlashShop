const mongoose = require("mongoose");

const priceTierSchema = new mongoose.Schema(
    {
        minQuantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
    },
    { _id: false },
);
const sizePricingSchema = new mongoose.Schema(
    {
        size: { type: String, required: true },
        tiers: { type: [priceTierSchema], default: [] },
    },
    { _id: false },
);
const albumTierSchema = new mongoose.Schema(
    {
        minQuantity: { type: Number, required: true, min: 1 },
        percent: { type: Number, required: true, min: 0, max: 100 },
    },
    { _id: false },
);

/** The photo development price list (single document) — the admin edits it on the "photo development prices" screen */
const photoPricingSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        sizes: { type: [sizePricingSchema], default: [] },
        albumDiscountTiers: { type: [albumTierSchema], default: [] },
    },
    { timestamps: true },
);

exports.PhotoPricingModel = mongoose.model("photoPricing", photoPricingSchema);
