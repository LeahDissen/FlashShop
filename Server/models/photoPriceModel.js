const mongoose = require("mongoose");

const photoPriceSchema = new mongoose.Schema({
    size: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    label: { type: String, required: true }
});

exports.PhotoPriceModel = mongoose.model("photoPrices", photoPriceSchema);