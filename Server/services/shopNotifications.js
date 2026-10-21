/**
 * The shop owner's email settings: alerts about new orders and contact messages, and the address
 * customers' replies go to. Edited in the admin ("מועדון והנחות" > הגדרות מייל), never shown publicly.
 */
const mongoose = require("mongoose");
const { getClientUrl } = require("../utils/clientUrl");
const { config } = require("../config/secret");

const CACHE_MS = 60_000;
let cache = { at: 0, value: null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const cleanEmail = (value) => {
    const email = String(value || "").trim().toLowerCase().slice(0, 200);
    return EMAIL_PATTERN.test(email) ? email : "";
};

/** The email settings, read at most once a minute; empty when the database is not connected (e.g. in tests) */
async function loadEmailSettings() {
    if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;
    if (mongoose.connection.readyState !== 1) return { notifications: {}, replyToEmail: "" };
    // Required here, not at the top: utils/sendEmail loads this module, and some code reloads sendEmail
    const { ShopSettingsModel } = require("../models/shopSettingsModel");
    const settings = await ShopSettingsModel.findOne({ key: "default" }).select("notifications replyToEmail").lean();
    const value = {
        notifications: {
            email: cleanEmail(settings?.notifications?.email),
            newOrder: settings?.notifications?.newOrder !== false,
            newMessage: settings?.notifications?.newMessage !== false,
        },
        replyToEmail: cleanEmail(settings?.replyToEmail),
    };
    cache = { at: Date.now(), value };
    return value;
}

/** After the admin saves the settings, so the next email uses them right away */
const clearEmailSettingsCache = () => { cache = { at: 0, value: null }; };

/** The reply-to address for the site's emails, or "" */
async function replyToAddress() {
    try {
        return (await loadEmailSettings()).replyToEmail;
    } catch {
        return "";
    }
}

/**
 * Emails the shop owner about a new order or message, when she set an address and the alert is on.
 * Never throws: an alert that fails must not fail the order or the message.
 * @param {"newOrder"|"newMessage"} kind
 */
async function notifyShopOwner(kind, { subject, payload, template, replyTo }) {
    try {
        const { notifications } = await loadEmailSettings();
        if (notifications[kind] === false) return;
        // Messages went to the shop's own mailbox before this setting existed: kept until an address is set
        const to = notifications.email || (kind === "newMessage" && config.USER && config.PASS ? config.USER : "");
        if (!to) return;
        // Required here: utils/sendEmail requires this module for the reply-to address
        const { sendEmail } = require("../utils/sendEmail");
        await sendEmail(to, subject, payload, template, [], { replyTo });
    } catch (err) {
        console.error(`[Notify] ${kind} alert failed:`, err.message);
    }
}

/** "מחכה לכם הזמנה באתר": the order's number, customer, total and a link to it in the admin */
const notifyNewOrder = (order) => {
    const number = String(order._id).slice(-8).toUpperCase();
    const customer = order.customer?.name || order.customer?.email || "";
    const lines = [
        `הזמנה ${number}${customer ? ` מאת ${customer}` : ""}`,
        `סכום: ${Number(order.total_price || 0).toFixed(2)} ₪`,
        `${order.fulfillment_method === "delivery" ? "משלוח" : "איסוף עצמי"} · ${(order.items || []).length} פריטים`,
        "",
        `לצפייה בהזמנה: ${getClientUrl()}/ordersmanagement/${order._id}`,
    ];
    return notifyShopOwner("newOrder", {
        subject: `מחכה לכם הזמנה באתר 🎉 (${number})`,
        payload: { title: "מחכה לכם הזמנה באתר", message: lines.join("\n") },
        template: "./template/generalMail.handlebars",
        replyTo: order.customer?.email,
    });
};

/** A message from the contact form; replying to the alert answers the customer */
const notifyNewMessage = ({ name, email, message }) => notifyShopOwner("newMessage", {
    subject: `הודעה חדשה באתר מאת ${name}`,
    payload: {
        title: "ממתינה לך הודעה חדשה באתר",
        message: [`מאת: ${name} (${email})`, "", message, "", `כל ההודעות: ${getClientUrl()}/viewmessages`].join("\n"),
    },
    template: "./template/generalMail.handlebars",
    replyTo: email,
});

module.exports = { cleanEmail, loadEmailSettings, clearEmailSettingsCache, replyToAddress, notifyNewOrder, notifyNewMessage };
