const mongoose = require("mongoose");

const CATEGORIES = [
    "shape",
    "elementBackground",
    "canvasBackground",
    "graphic",
    "icon",
    "color",
];

const TYPES = ["shape", "image", "color"];

/**
 * פריט בספריית עורך העיצוב העצמי (צורות, רקעים, גרפיקות, אייקונים, צבעים).
 * seedKey משמש רק לזריעה ראשונית כדי לא לשכפל פריטים קיימים.
 */
const editorAssetSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: CATEGORIES,
            index: true,
        },
        title: { type: String, required: true, trim: true },
        src: { type: String, default: "", trim: true },
        content: { type: String, default: "" },
        type: { type: String, enum: TYPES, default: "image" },
        colorValue: { type: String, default: "", trim: true },
        colorClass: { type: String, default: "", trim: true },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
        seedKey: { type: String, trim: true },
    },
    { timestamps: true },
);

editorAssetSchema.index(
    { seedKey: 1 },
    { unique: true, partialFilterExpression: { seedKey: { $type: "string", $gt: "" } } },
);

editorAssetSchema.index({ category: 1, sortOrder: 1, createdAt: 1 });

exports.CATEGORIES = CATEGORIES;
exports.TYPES = TYPES;
exports.EditorAssetModel = mongoose.model("EditorAsset", editorAssetSchema);
