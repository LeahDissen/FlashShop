const {
    OrderEmailTemplateModel,
    ORDER_EMAIL_STATUSES,
    DEFAULT_ORDER_EMAIL_TEMPLATES,
} = require("../models/orderEmailTemplateModel");
const { UserModel } = require("../models/userModel");
const { sendEmail } = require("../utils/sendEmail");

const FULFILLMENT_LABELS = { pickup: "איסוף עצמי", delivery: "משלוח" };

/** טוען את כל התבניות; סטטוס שעדיין אין לו תבנית מקבל את ברירת המחדל */
const loadOrderEmailTemplates = async () => {
    const existing = await OrderEmailTemplateModel.find({ status: { $in: ORDER_EMAIL_STATUSES } }).lean();
    const byStatus = new Map(existing.map((template) => [template.status, template]));

    const missing = ORDER_EMAIL_STATUSES.filter((status) => !byStatus.has(status));
    if (missing.length > 0) {
        const created = await OrderEmailTemplateModel.insertMany(
            missing.map((status) => ({ status, ...DEFAULT_ORDER_EMAIL_TEMPLATES[status] })),
        );
        created.forEach((template) => byStatus.set(template.status, template.toObject()));
    }

    return ORDER_EMAIL_STATUSES.map((status) => byStatus.get(status));
};

const shortOrderNumber = (order) => String(order._id).slice(-8).toUpperCase();

const formatItems = (items = []) => items
    .map((item) => {
        const size = item.size ? ` (${item.size})` : "";
        return `• ${item.name}${size} × ${item.quantity || 1} – ₪${Number(item.price || 0).toFixed(2)}`;
    })
    .join("\n");

const buildTemplateVars = (order, customerName) => ({
    name: customerName || "לקוח/ה יקר/ה",
    orderNumber: shortOrderNumber(order),
    total: Number(order.total_price || 0).toFixed(2),
    items: formatItems(order.items),
    fulfillment: FULFILLMENT_LABELS[order.fulfillment_method] || FULFILLMENT_LABELS.pickup,
});

/** החלפת {{key}} בערכים; מפתח לא מוכר נשאר כמו שהוא כדי שהמנהלת תראה את הטעות */
const renderTemplate = (text, vars) =>
    String(text || "").replace(/{{\s*(\w+)\s*}}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
    );

/** נמען: המייל שהוזן בקופה, ואם אין – המייל של חשבון המשתמש */
const resolveRecipient = async (order) => {
    if (order.customer?.email) {
        return { email: order.customer.email, name: order.customer.name };
    }
    const userId = order.user_id?._id || order.user_id;
    if (!userId) return null;
    const user = await UserModel.findById(userId).select("name email").lean();
    return user?.email ? { email: user.email, name: order.customer?.name || user.name } : null;
};

/**
 * שולח ללקוח את מייל הסטטוס המתאים. לעולם לא זורק – כשל במייל
 * לא אמור להכשיל יצירת הזמנה או עדכון סטטוס.
 */
exports.sendOrderStatusEmail = async (order, status) => {
    try {
        if (!ORDER_EMAIL_STATUSES.includes(status)) return { sent: false, reason: "unknown-status" };

        const template = await OrderEmailTemplateModel.findOne({ status }).lean()
            || { status, ...DEFAULT_ORDER_EMAIL_TEMPLATES[status] };
        if (!template.enabled) return { sent: false, reason: "disabled" };

        const recipient = await resolveRecipient(order);
        if (!recipient) {
            console.warn(`[OrderEmail][order=${order._id}] no recipient email, skipping ${status}`);
            return { sent: false, reason: "no-recipient" };
        }

        const vars = buildTemplateVars(order, recipient.name);
        await sendEmail(
            recipient.email,
            renderTemplate(template.subject, vars),
            { title: renderTemplate(template.subject, vars), message: renderTemplate(template.body, vars) },
            "./template/orderStatus.handlebars",
        );
        return { sent: true };
    } catch (err) {
        console.error(`[OrderEmail][order=${order?._id}] failed to send ${status}:`, err.message);
        return { sent: false, reason: "error" };
    }
};

exports.loadOrderEmailTemplates = loadOrderEmailTemplates;
exports.renderTemplate = renderTemplate;
