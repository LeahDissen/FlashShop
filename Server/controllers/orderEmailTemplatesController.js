/** The automatic order emails (one per status) that the admin edits */
const { loadOrderEmailTemplates } = require("../services/orderEmailService");
const { OrderEmailTemplateModel, ORDER_EMAIL_STATUSES, ORDER_EMAIL_PLACEHOLDERS } = require("../models/orderEmailTemplateModel");
const { sanitizeText } = require("../utils/orderItems");

exports.getOrderEmailTemplates = async (req, res) => {
    try {
        const templates = await loadOrderEmailTemplates();
        res.json({ templates, placeholders: ORDER_EMAIL_PLACEHOLDERS });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת נוסחי המיילים" });
    }
};

exports.updateOrderEmailTemplate = async (req, res) => {
    try {
        const { status } = req.params;
        if (!ORDER_EMAIL_STATUSES.includes(status)) {
            return res.status(404).json({ msg: "סטטוס לא קיים" });
        }

        const subject = sanitizeText(req.body?.subject, 200);
        const body = String(req.body?.body || "").trim().slice(0, 5000);
        const enabled = req.body?.enabled !== false;
        if (!subject || !body) {
            return res.status(400).json({ msg: "יש למלא נושא וגוף למייל" });
        }

        const template = await OrderEmailTemplateModel.findOneAndUpdate(
            { status },
            { $set: { subject, body, enabled } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );
        res.json(template);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשמירת נוסח המייל" });
    }
};
