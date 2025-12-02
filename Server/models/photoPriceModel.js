const mongoose = require("mongoose");

const photoPriceSchema = new mongoose.Schema({
    size: { type: String, required: true, unique: true }, // e.g., "10x15"
    price: { type: Number, required: true },              // e.g., 1.20
    label: { type: String, required: true }               // e.g., "10x15 cm"
});

exports.PhotoPriceModel = mongoose.model("photoPrices", photoPriceSchema);