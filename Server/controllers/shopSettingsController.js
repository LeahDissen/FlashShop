const { cleanEmail, clearEmailSettingsCache } = require("../services/shopNotifications");
const { ShopSettingsModel } = require("../models/shopSettingsModel");

const SETTINGS_KEY = "default";

const isValidHttpUrl = (value) => {
    if (!value) return true;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const loadShopSettings = async () => {
    let settings = await ShopSettingsModel.findOne({ key: SETTINGS_KEY });
    if (!settings) {
        settings = await ShopSettingsModel.create({ key: SETTINGS_KEY, paymentLinkUrl: "" });
    }
    return settings;
};

exports.loadShopSettings = loadShopSettings;

const publicSettings = (settings) => ({
    paymentLinkUrl: settings.paymentLinkUrl || "",
    clubGift: {
        enabled: Boolean(settings.clubGift?.enabled),
        productId: settings.clubGift?.productId || "",
        discountType: settings.clubGift?.discountType === "price" ? "price" : "percent",
        value: Number(settings.clubGift?.value ?? 100),
        emailSubject: settings.clubGift?.emailSubject || "",
        emailBody: settings.clubGift?.emailBody || "",
    },
    notMemberText: settings.notMemberText || "",
    siteClosed: Boolean(settings.siteClosed),
    closedMessage: settings.closedMessage || "",
});

/** The join gift as the admin sends it; returns { error } when invalid */
const sanitizeClubGift = (gift = {}) => {
    const discountType = gift.discountType === "price" ? "price" : "percent";
    const value = Number(gift.value);
    if (!Number.isFinite(value) || value < 0 || (discountType === "percent" && value > 100)) {
        return { error: "ערך מתנת ההצטרפות לא תקין: אחוז בין 0 ל-100, או מחיר 0 ומעלה" };
    }
    const enabled = gift.enabled === true;
    const productId = String(gift.productId || "").trim().slice(0, 64);
    if (enabled && !productId) {
        return { error: "כדי להפעיל את מתנת ההצטרפות יש לבחור מוצר" };
    }
    return {
        clubGift: {
            enabled,
            productId,
            discountType,
            value,
            emailSubject: String(gift.emailSubject || "").trim().slice(0, 200),
            emailBody: String(gift.emailBody || "").trim().slice(0, 5000),
        },
    };
};

/** The shop owner's email settings – admin only, never in the public settings */
const emailSettings = (settings) => ({
    notifications: {
        email: settings.notifications?.email || "",
        newOrder: settings.notifications?.newOrder !== false,
        newMessage: settings.notifications?.newMessage !== false,
    },
    replyToEmail: settings.replyToEmail || "",
});

/** An email address field from the admin: "" clears it; returns { error } for an invalid address */
const emailField = (value, label) => {
    const raw = String(value ?? "").trim();
    if (!raw) return { value: "" };
    const email = cleanEmail(raw);
    return email ? { value: email } : { error: `כתובת המייל ב"${label}" אינה תקינה` };
};

exports.getEmailSettings = async (req, res) => {
    try {
        res.json(emailSettings(await loadShopSettings()));
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת הגדרות המייל" });
    }
};

exports.updateEmailSettings = async (req, res) => {
    try {
        const notifyEmail = emailField(req.body?.notifications?.email, "מייל להתראות");
        if (notifyEmail.error) return res.status(400).json({ msg: notifyEmail.error });
        const replyTo = emailField(req.body?.replyToEmail, "כתובת לתשובות של לקוחות");
        if (replyTo.error) return res.status(400).json({ msg: replyTo.error });
        const settings = await ShopSettingsModel.findOneAndUpdate(
            { key: SETTINGS_KEY },
            {
                $set: {
                    notifications: {
                        email: notifyEmail.value,
                        newOrder: req.body?.notifications?.newOrder !== false,
                        newMessage: req.body?.notifications?.newMessage !== false,
                    },
                    replyToEmail: replyTo.value,
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );
        clearEmailSettingsCache();
        res.json(emailSettings(settings));
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשמירת הגדרות המייל" });
    }
};

exports.getShopSettings = async (req, res) => {
    try {
        const settings = await loadShopSettings();
        res.json(publicSettings(settings));
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת הגדרות החנות" });
    }
};

exports.updateShopSettings = async (req, res) => {
    try {
        const current = await loadShopSettings();
        const paymentLinkUrl = req.body?.paymentLinkUrl === undefined
            ? current.paymentLinkUrl || ""
            : String(req.body.paymentLinkUrl ?? "").trim();
        if (!isValidHttpUrl(paymentLinkUrl)) {
            return res.status(400).json({ msg: "קישור התשלום אינו תקין. יש להזין כתובת שמתחילה ב-http או https." });
        }

        const $set = { paymentLinkUrl };
        if (req.body?.clubGift !== undefined) {
            const { clubGift, error } = sanitizeClubGift(req.body.clubGift);
            if (error) return res.status(400).json({ msg: error });
            $set.clubGift = clubGift;
        }
        if (req.body?.notMemberText !== undefined) {
            $set.notMemberText = String(req.body.notMemberText || "").trim().slice(0, 500);
        }
        if (req.body?.siteClosed !== undefined) {
            $set.siteClosed = req.body.siteClosed === true;
        }
        if (req.body?.closedMessage !== undefined) {
            $set.closedMessage = String(req.body.closedMessage || "").trim().slice(0, 500);
        }

        const settings = await ShopSettingsModel.findOneAndUpdate(
            { key: SETTINGS_KEY },
            { $set },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        res.json(publicSettings(settings));
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשמירת הגדרות החנות" });
    }
};
