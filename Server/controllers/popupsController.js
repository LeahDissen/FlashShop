const { PopupModel } = require("../models/popupModel");

const sanitizeText = (value, max) => String(value ?? "").trim().slice(0, max);

const isValidUrl = (value) => {
    if (!value) return true;
    if (value.startsWith("/")) return true;
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const normalizePath = (value) => {
    const path = String(value || "").trim();
    if (!path) return "";
    return path.startsWith("/") ? path.replace(/\/+$/, "") || "/" : `/${path}`;
};

const parseDate = (value) => {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
};

const sanitizePopupBody = (body = {}) => {
    const data = {
        title: sanitizeText(body.title, 200),
        body: sanitizeText(body.body, 3000),
        imageUrl: sanitizeText(body.imageUrl, 1000),
        ctaText: sanitizeText(body.ctaText, 60),
        ctaUrl: sanitizeText(body.ctaUrl, 1000),
        pages: Array.isArray(body.pages) ? body.pages.map(normalizePath).filter(Boolean) : [],
        delaySeconds: Math.min(600, Math.max(0, Number(body.delaySeconds) || 0)),
        showOncePerSession: body.showOncePerSession !== false,
        isActive: body.isActive !== false,
        startsAt: parseDate(body.startsAt),
        endsAt: parseDate(body.endsAt),
        sortOrder: Number(body.sortOrder) || 0,
    };
    if (!data.title) return { error: "יש להזין כותרת לפופאפ" };
    if (!isValidUrl(data.ctaUrl)) return { error: "קישור הכפתור אינו תקין" };
    if (data.startsAt && data.endsAt && data.endsAt < data.startsAt) return { error: "תאריך הסיום לפני תאריך ההתחלה" };
    return { data };
};

/** הפופאפים הפעילים כרגע לעמוד נתון (ציבורי – הלקוח בוחר מהם מה להציג) */
exports.getActivePopups = async (req, res) => {
    try {
        const now = new Date();
        const path = normalizePath(req.query.path) || "/";
        const popups = await PopupModel.find({
            isActive: true,
            $and: [
                { $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
                { $or: [{ endsAt: null }, { endsAt: { $exists: false } }, { endsAt: { $gte: now } }] },
                { $or: [{ pages: { $size: 0 } }, { pages: path }] },
            ],
        })
            .sort({ sortOrder: 1, createdAt: -1 })
            .select("title body imageUrl ctaText ctaUrl delaySeconds showOncePerSession")
            .lean();
        res.json(popups);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת הפופאפים" });
    }
};

exports.getAllPopups = async (req, res) => {
    try {
        const popups = await PopupModel.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
        res.json(popups);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת הפופאפים" });
    }
};

exports.addPopup = async (req, res) => {
    try {
        const { data, error } = sanitizePopupBody(req.body);
        if (error) return res.status(400).json({ msg: error });
        const popup = await PopupModel.create(data);
        res.status(201).json(popup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה ביצירת הפופאפ" });
    }
};

exports.updatePopup = async (req, res) => {
    try {
        const { data, error } = sanitizePopupBody(req.body);
        if (error) return res.status(400).json({ msg: error });
        const popup = await PopupModel.findByIdAndUpdate(
            req.params.id,
            { $set: data, $unset: { ...(data.startsAt ? {} : { startsAt: 1 }), ...(data.endsAt ? {} : { endsAt: 1 }) } },
            { new: true, runValidators: true },
        );
        if (!popup) return res.status(404).json({ msg: "הפופאפ לא נמצא" });
        res.json(popup);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בעדכון הפופאפ" });
    }
};

exports.deletePopup = async (req, res) => {
    try {
        const deleted = await PopupModel.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ msg: "הפופאפ לא נמצא" });
        res.json({ msg: "הפופאפ נמחק" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה במחיקת הפופאפ" });
    }
};
