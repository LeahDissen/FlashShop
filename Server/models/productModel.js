const mongoose = require("mongoose");
const Joi = require("joi");
let productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {type:String,required:true},
    category: { type: String, required: true },
    /** design = עיצוב מלא | simple = תמונה+מחיר | magnet = מגנטים (העלאת תמונה) */
    displayType: { type: String, enum: ['design', 'simple', 'magnet'], default: 'design' },
    /** גודל המגנט כשדה של המוצר הבודד — לא וריאציה בתוך אותו מוצר */
    size: { type: String, default: "", trim: true },
    stock: { type: Number, required: true },
    /** "Sale" badge on the product – the price itself is updated manually, there is no discount logic */
    isOnSale: { type: Boolean, default: false },
    /** The price before the sale – shown struck through next to the current price when the product is on sale */
    originalPrice: { type: Number, min: 0, default: null },
    /** מידות אזור ההדפסה בס"מ – משמשות לגודל משטח העבודה בעורך */
    printWidth: { type: Number, default: 12 },
    printHeight: { type: Number, default: 18 },
    /** האם הלקוח רשאי להפוך כיוון משטח (אורך/רוחב) בעורך */
    allowOrientationToggle: { type: Boolean, default: false },
    /** משפטים מתאימים לכיתוב על המוצר – מוצגים ללקוח בעמוד רעיונות לכיתובים */
    captionIdeas: [{
        text: { type: String, required: true, trim: true },
        category: { type: String, default: "כללי", trim: true },
    }],
    /** מדרגות מחיר לפי כמות — ריק = מחיר קבוע בלבד */
    priceTiers: [{
        minQuantity: { type: Number, required: true, min: 1 },
        maxQuantity: { type: Number, default: null },
        unitPrice: { type: Number, required: true, min: 0 },
    }],
}, { timestamps: true });
exports.ProductModel = mongoose.model("products", productSchema);
