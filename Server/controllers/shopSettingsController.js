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

exports.getShopSettings = async (req, res) => {
    try {
        const settings = await loadShopSettings();
        res.json({
            paymentLinkUrl: settings.paymentLinkUrl || "",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת הגדרות החנות" });
    }
};

exports.updateShopSettings = async (req, res) => {
    try {
        const paymentLinkUrl = String(req.body?.paymentLinkUrl ?? "").trim();
        if (!isValidHttpUrl(paymentLinkUrl)) {
            return res.status(400).json({ msg: "קישור התשלום אינו תקין. יש להזין כתובת שמתחילה ב-http או https." });
        }

        const settings = await ShopSettingsModel.findOneAndUpdate(
            { key: SETTINGS_KEY },
            { $set: { paymentLinkUrl } },
            { new: true, upsert: true, setDefaultsOnInsert: true },
        );

        res.json({
            paymentLinkUrl: settings.paymentLinkUrl || "",
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בשמירת הגדרות החנות" });
    }
};
