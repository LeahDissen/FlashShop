const mongoose = require("mongoose");
const Joi = require("joi");
let productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {type:String,required:true},
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    /** מידות אזור ההדפסה בס"מ – משמשות לגודל משטח העבודה בעורך */
    printWidth: { type: Number, default: 12 },
    printHeight: { type: Number, default: 18 },
}, { timestamps: true });
exports.ProductModel = mongoose.model("products", productSchema);
