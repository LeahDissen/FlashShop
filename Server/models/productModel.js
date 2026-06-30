const mongoose = require("mongoose");
const Joi = require("joi");
let productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: {type:String,required:true},
    category: { type: String, required: true },
    /** design = עיצוב מלא | simple = תמונה+מחיר | magnet = מגנטים עם גדלים */
    displayType: { type: String, enum: ['design', 'simple', 'magnet'], default: 'design' },
    stock: { type: Number, required: true },
    /** מידות אזור ההדפסה בס"מ – משמשות לגודל משטח העבודה בעורך */
    printWidth: { type: Number, default: 12 },
    printHeight: { type: Number, default: 18 },
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
