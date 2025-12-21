const mongoose = require("mongoose");
const Joi = require("joi");
let productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {type:String,required:true},
    category: { type: String, required: true },
    stock: { type: Number, required: true },
}, { timestamps: true });
exports.ProductModel = mongoose.model("products", productSchema);
