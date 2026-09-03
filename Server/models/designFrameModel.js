const mongoose = require("mongoose");

const dropzoneSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, trim: true },
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        clipType: { type: String, default: "rect", trim: true },
        clipPath: { type: String, default: "", trim: true },
        label: { type: String, default: "", trim: true },
    },
    { _id: false },
);

const designFrameSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        imageUrl: { type: String, required: true, trim: true },
        thumbnailUrl: { type: String, trim: true, default: "" },
        category: { type: String, default: "כללי", trim: true },
        aspectRatio: { type: String, required: true, trim: true },
        /** מזהה מידת ההדפסה (תיקייה) שאליה שייכת המסגרת – ריק = זמינה לכל המידות */
        printSizeKey: { type: String, default: "", trim: true },
        /** כיוון המסגרת בתוך התיקייה */
        orientation: { type: String, enum: ["landscape", "portrait", "any"], default: "any" },
        /** מסגרת קבועה: נפרסת על כל המשטח ואינה ניתנת להזזה על ידי הלקוח */
        isFixedOverlay: { type: Boolean, default: true },
        layoutType: { type: String, enum: ["single_overlay", "multi_dropzone"], default: "single_overlay" },
        dropzones: { type: [dropzoneSchema], default: [] },
        isActive: { type: Boolean, default: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true },
);

exports.DesignFrameModel = mongoose.model("DesignFrame", designFrameSchema);
