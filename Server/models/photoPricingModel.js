const mongoose = require("mongoose");

const sizePriceSchema = new mongoose.Schema(
    { size: { type: String, required: true }, price: { type: Number, required: true, min: 0 } },
    { _id: false },
);
const quantityTierSchema = new mongoose.Schema(
    {
        minQuantity: { type: Number, required: true, min: 1 },
        discountPercent: { type: Number, required: true, min: 0, max: 100 },
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

/** מחירון פיתוח התמונות (מסמך יחיד) — המנהלת עורכת אותו במסך "מחירי פיתוח תמונות" */
const photoPricingSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        sizes: { type: [sizePriceSchema], default: [] },
        quantityTiers: { type: [quantityTierSchema], default: [] },
        albumDiscountTiers: { type: [albumTierSchema], default: [] },
    },
    { timestamps: true },
);

exports.PhotoPricingModel = mongoose.model("photoPricing", photoPricingSchema);
