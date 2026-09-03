const mongoose = require("mongoose");

const printSizeSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        widthCm: { type: Number, required: true },
        heightCm: { type: Number, required: true },
        sortOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { _id: false },
);

const fontOptionSchema = new mongoose.Schema(
    {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
    },
    { _id: false },
);

/**
 * מסמך הגדרות יחיד (singleton) לעורך התמונות.
 * כל הטקסטים והאפשרויות שהמנהלת יכולה לשנות נשמרים כאן ולא בקוד.
 */
const editorSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, default: "default", unique: true },
        framePrintSizes: { type: [printSizeSchema], default: [] },
        orientationLabels: {
            landscape: { type: String, default: "לרוחב" },
            portrait: { type: String, default: "לאורך" },
            any: { type: String, default: "מתאים לשניהם" },
        },
        frameFolders: {
            title: { type: String, default: "מסגרות עיצוב" },
            subtitle: { type: String, default: "בחרו תיקיית מידה ואז מסגרת לרוחב או לאורך" },
            emptyText: { type: String, default: "אין מסגרות זמינות במידה זו" },
        },
        textToolbar: {
            fonts: { type: [fontOptionSchema], default: [] },
            colorPresets: { type: [String], default: [] },
            minFontSize: { type: Number, default: 8 },
            maxFontSize: { type: Number, default: 200 },
        },
        captionDefaults: {
            buttonLabel: { type: String, default: "הוסף כתובית לתמונה" },
            placeholder: { type: String, default: "כתובית לתמונה" },
            fontFamily: { type: String, default: "Rubik" },
            fontSize: { type: Number, default: 24 },
            color: { type: String, default: "#FFFFFF" },
        },
        orientationPrompt: {
            title: { type: String, default: "כיוון התמונה לא תואם למסגרת" },
            body: {
                type: String,
                default: "אפשר לסובב את התמונה ב-90° כדי שתתאים לכיוון המסגרת שנבחרה.",
            },
            rotateLabel: { type: String, default: "סובב ב-90°" },
            dismissLabel: { type: String, default: "השאר כמו שזה" },
        },
        drive: {
            rootFolderName: { type: String, default: "FlashShop Orders" },
            orderFolderTemplate: { type: String, default: "הזמנה {orderId} - {date}" },
        },
    },
    { timestamps: true },
);

exports.EditorSettingsModel = mongoose.model("EditorSettings", editorSettingsSchema);
