/** The club's emails to a new member: the welcome email, the gift email confirmation and the join gift */
const axios = require("axios");
const { PageModel } = require("../models/pageModel");
const { ProductModel } = require("../models/productModel");
const { sendEmail } = require("../utils/sendEmail");

const DEFAULT_WELCOME_SUBJECT = "ברוכים הבאים למועדון! 🎁";

/** {{name}} / {{code}} in the text the admin writes; an unknown key is left visible */
const renderWelcomeText = (text, vars) =>
    String(text || "").replace(/{{\s*(\w+)\s*}}/g, (match, key) =>
        Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match,
    );

/** Downloads the gift file (PDF) to attach it to the email; a failure does not block the email itself */
const fetchWelcomeAttachment = async (url) => {
    if (!url) return [];
    try {
        const response = await axios.get(url, { responseType: "arraybuffer", timeout: 15000, maxContentLength: 15 * 1024 * 1024 });
        const nameFromUrl = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
        const filename = /\.pdf$/i.test(nameFromUrl) ? nameFromUrl : "gift.pdf";
        return [{ filename, content: Buffer.from(response.data), contentType: "application/pdf" }];
    } catch (err) {
        console.error("[Club] welcome attachment download failed:", err.message);
        return [];
    }
};

/** Sends the join email per the settings on the 'club' page (subject, body, attachment) */
const sendWelcomeEmail = async ({ email, name, code }) => {
    const page = await PageModel.findOne({ key: "club" }).lean();
    const settings = page?.data || {};
    const vars = { name, code };
    // Without the join gift there is no code: lines of the admin's body that show {{code}} are left out
    const withoutCodeLines = (text) => (code ? text : String(text || "").split("\n").filter((line) => !/{{\s*code\s*}}/.test(line)).join("\n"));
    const subject = renderWelcomeText(settings.welcomeSubject || DEFAULT_WELCOME_SUBJECT, vars);
    const attachments = await fetchWelcomeAttachment(settings.welcomeAttachmentUrl);

    if (settings.welcomeBody) {
        return sendEmail(
            email,
            subject,
            { title: subject, message: renderWelcomeText(withoutCodeLines(settings.welcomeBody), vars) },
            "./template/generalMail.handlebars",
            attachments,
        );
    }
    return sendEmail(email, subject, vars, "./template/clubWelcome.handlebars", attachments);
};

const DEFAULT_GIFT_SUBJECT = "מתנת הצטרפות למועדון 🎁";
const DEFAULT_GIFT_BODY = "היי {{name}},\nשמחים שהצטרפת! מחכה לך מתנה: {{product}}.\nקוד המתנה שלך: {{code}}\nהמתנה תתווסף אוטומטית בקופה כשתזמיני את המוצר (מחוברת עם המייל הזה), או בהזנת הקוד.";

/** The join gift email: the product and the personal code, in the text the admin wrote */
const sendJoinGiftEmail = async ({ email, name, code, clubGift }) => {
    const product = await ProductModel.findById(clubGift.productId).select("name").lean().catch(() => null);
    const vars = { name, code, product: product?.name || "" };
    const subject = renderWelcomeText(clubGift.emailSubject || DEFAULT_GIFT_SUBJECT, vars);
    return sendEmail(
        email,
        subject,
        { title: subject, message: renderWelcomeText(clubGift.emailBody || DEFAULT_GIFT_BODY, vars) },
        "./template/generalMail.handlebars",
    );
};

/** The join gift is sent only after the member confirms her email, so made-up addresses get no gift */
const sendGiftConfirmEmail = ({ email, name, confirmUrl }) => {
    const subject = "אישור המייל לקבלת מתנת ההצטרפות 🎁";
    return sendEmail(
        email,
        subject,
        { title: subject, message: `היי ${name},\nכדי לקבל את מתנת ההצטרפות, יש לאשר את כתובת המייל בקישור הזה:\n${confirmUrl}\nמיד אחרי האישור נשלח אלייך קוד המתנה.` },
        "./template/generalMail.handlebars",
    );
};

module.exports = { sendWelcomeEmail, sendJoinGiftEmail, sendGiftConfirmEmail };
