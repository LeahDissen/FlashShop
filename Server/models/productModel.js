const mongoose = require("mongoose");
const Joi = require("joi");
let productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {type:String,required:true},
    category: { type: String, required: true },
    /** design = full design | simple = image + price | magnet = magnets (photo upload) */
    displayType: { type: String, enum: ['design', 'simple', 'magnet'], default: 'design' },
    /** The magnet size as a field of the individual product — not a variant inside the same product */
    size: { type: String, default: "", trim: true },
    stock: { type: Number, required: true },
    /** "Sale" badge on the product – the price itself is updated manually, there is no discount logic */
    isOnSale: { type: Boolean, default: false },
    /** A shaped product: the customer designs only inside the shape, the print is transparent outside it */
    shape: {
        type: { type: String, enum: ["circle", "heart", "star", "flower", "custom"] },
        maskUrl: { type: String },
    },
    /** Club members' discount on this product: a percent off, or a final price. Given at checkout to members only */
    memberDiscount: {
        type: { type: String, enum: ["percent", "price"] },
        value: { type: Number, min: 0 },
    },
    /** The price before the sale – shown struck through next to the current price when the product is on sale */
    originalPrice: { type: Number, min: 0, default: null },
    /** Print area dimensions in cm – used for the editor canvas size */
    printWidth: { type: Number, default: 12 },
    printHeight: { type: Number, default: 18 },
    /** Whether the customer may flip the canvas orientation (portrait/landscape) in the editor */
    allowOrientationToggle: { type: Boolean, default: false },
    /** Sentences that fit as a caption on the product – shown to the customer on the caption ideas page */
    captionIdeas: [{
        text: { type: String, required: true, trim: true },
        category: { type: String, default: "כללי", trim: true },
    }],
    /** Price tiers by quantity — empty = fixed price only */
    priceTiers: [{
        minQuantity: { type: Number, required: true, min: 1 },
        maxQuantity: { type: Number, default: null },
        unitPrice: { type: Number, required: true, min: 0 },
    }],
}, { timestamps: true });
exports.ProductModel = mongoose.model("products", productSchema);
