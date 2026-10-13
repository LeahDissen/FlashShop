const mongoose = require("mongoose");

/** הדפים שהמנהלת עורכת מלוח הבקרה (טקסטים, תמונות, באנרים) */
const PAGE_KEYS = [
    "header",
    "home",
    "about",
    "terms",
    "tips",
    "club",
    "products",
    "photos",
    "cart",
    "footer",
    "product-categories",
];

/**
 * תוכן דף יחיד: אוסף שדות שטוח (מחרוזות; רשימות נשמרות כ-JSON string),
 * כפי שהלקוח שולח ומצפה לקבל.
 */
const pageSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, enum: PAGE_KEYS },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, minimize: false },
);

exports.PAGE_KEYS = PAGE_KEYS;
exports.PageModel = mongoose.model("Page", pageSchema);
