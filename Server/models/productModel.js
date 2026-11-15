const mongoose = require("mongoose");
const Joi = require("joi");
let productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {type:String,required:true},
    category: { type: String, required: true },
    /** More categories the product is also listed under (the main `category` sets how it is designed) */
    extraCategories: { type: [String], default: [] },
    /** More product photos shown on the product page next to the main `image` */
    gallery: { type: [String], default: [] },
    /** design = full design | simple = image + price | magnet = magnets (photo upload) */
    displayType: { type: String, enum: ['design', 'simple', 'magnet'], default: 'design' },
    /** The magnet size as a field of the individual product — not a variant inside the same product */
    size: { type: String, default: "", trim: true },
    stock: { type: Number, required: true },
    /** Stock tracking: when on, every paid order lowers the stock and a sold-out product/variant cannot be ordered */
    trackStock: { type: Boolean, default: false },
    /** Colors the customer picks from (the price does not change by color); image = the product photo in that color */
    colors: [{
        _id: false,
        name: { type: String, required: true, trim: true },
        hex: { type: String, default: "#FFFFFF" },
        image: { type: String, default: "" },
    }],
    /** Sizes the customer picks from, e.g. shirts (the price does not change by size) */
    sizes: { type: [String], default: [] },
    /** Stock per color × size combination ("" = no such dimension), used when trackStock is on */
    variantStock: [{
        _id: false,
        color: { type: String, default: "" },
        size: { type: String, default: "" },
        stock: { type: Number, default: 0 },
    }],
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
    /** More areas the customer may design besides the main print area (e.g. a shirt's back), each with its own size in cm */
    designAreas: [{
        _id: false,
        name: { type: String, required: true, trim: true },
        printWidth: { type: Number, required: true },
        printHeight: { type: Number, required: true },
    }],
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
