const mongoose = require("mongoose");

/** הסטטוסים שמנהלת ההזמנות יכולה לקבוע (תואם ל-STATUS_OPTIONS בלקוח) */
const ORDER_EMAIL_STATUSES = ["processing", "shipped", "delivered", "cancelled"];

/** משתנים שאפשר לשלב בנושא ובגוף המייל */
const ORDER_EMAIL_PLACEHOLDERS = [
    { key: "name", label: "שם הלקוח" },
    { key: "orderNumber", label: "מספר הזמנה" },
    { key: "total", label: "סכום לתשלום" },
    { key: "items", label: "רשימת הפריטים" },
    { key: "fulfillment", label: "איסוף עצמי / משלוח" },
];

const DEFAULT_ORDER_EMAIL_TEMPLATES = {
    processing: {
        subject: "ההזמנה שלך התקבלה – FlashShop",
        body: "היי {{name}},\n\nתודה! ההזמנה שלך (מספר {{orderNumber}}) התקבלה ונמצאת בטיפול.\n\nפריטים:\n{{items}}\n\nסה\"כ: ₪{{total}}\nאופן קבלה: {{fulfillment}}\n\nנעדכן אותך במייל בכל שלב.",
        enabled: true,
    },
    shipped: {
        subject: "ההזמנה שלך יצאה לדרך – FlashShop",
        body: "היי {{name}},\n\nההזמנה שלך (מספר {{orderNumber}}) יצאה לדרך וצפויה להגיע לנקודת האיסוף הקרובה אליך בתוך 3–5 ימי עסקים.",
        enabled: true,
    },
    delivered: {
        subject: "ההזמנה שלך מוכנה – FlashShop",
        body: "היי {{name}},\n\nההזמנה שלך (מספר {{orderNumber}}) מוכנה לאיסוף עצמי. ניתן לאסוף אותה בין השעות 9:00–17:00.",
        enabled: true,
    },
    cancelled: {
        subject: "ההזמנה שלך בוטלה – FlashShop",
        body: "היי {{name}},\n\nההזמנה שלך (מספר {{orderNumber}}) בוטלה. אם זו טעות או שיש שאלה – אפשר להשיב למייל הזה.",
        enabled: true,
    },
};

/** נוסח המייל שנשלח ללקוח בכל סטטוס – המנהלת עורכת אותו בלוח הבקרה */
const orderEmailTemplateSchema = new mongoose.Schema(
    {
        status: { type: String, required: true, unique: true, enum: ORDER_EMAIL_STATUSES },
        subject: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        enabled: { type: Boolean, default: true },
    },
    { timestamps: true },
);

exports.ORDER_EMAIL_STATUSES = ORDER_EMAIL_STATUSES;
exports.ORDER_EMAIL_PLACEHOLDERS = ORDER_EMAIL_PLACEHOLDERS;
exports.DEFAULT_ORDER_EMAIL_TEMPLATES = DEFAULT_ORDER_EMAIL_TEMPLATES;
exports.OrderEmailTemplateModel = mongoose.model("OrderEmailTemplate", orderEmailTemplateSchema);
