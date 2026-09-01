const { isDriveConfigured, uploadDesignToStaging } = require("../services/googleDriveService");

const MAX_DESIGN_BYTES = 30 * 1024 * 1024;

const sanitizeFileName = (value, fallback) => {
    const cleaned = String(value || "")
        .replace(/[\\/:*?"<>|]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned.slice(0, 120) || fallback;
};

const extensionForDataUrl = (dataUrl) => {
    if (String(dataUrl).startsWith("data:image/jpeg")) return "jpg";
    if (String(dataUrl).startsWith("data:image/webp")) return "webp";
    return "png";
};

exports.getDriveStatus = (req, res) => {
    res.json({ configured: isDriveConfigured() });
};

/**
 * מעלה את קובץ העיצוב הסופי ל-Drive לפני יצירת ההזמנה.
 * הקובץ נשמר בתיקיית המתנה ומועבר לתיקיית ההזמנה ברגע שההזמנה נוצרת.
 */
exports.uploadDesign = async (req, res) => {
    try {
        if (!isDriveConfigured()) {
            return res.json({ configured: false });
        }

        const { image, projectName } = req.body || {};
        if (typeof image !== "string" || !image.startsWith("data:image/")) {
            return res.status(400).json({ msg: "יש לשלוח תמונת עיצוב תקינה" });
        }

        const approximateBytes = Math.floor((image.length * 3) / 4);
        if (approximateBytes > MAX_DESIGN_BYTES) {
            return res.status(413).json({ msg: "קובץ העיצוב גדול מדי לשמירה בענן" });
        }

        const baseName = sanitizeFileName(projectName, "עיצוב");
        const fileName = `${baseName}-${Date.now()}.${extensionForDataUrl(image)}`;

        const uploaded = await uploadDesignToStaging({ dataUrl: image, fileName });
        if (!uploaded) {
            return res.json({ configured: false });
        }

        res.status(201).json({ configured: true, file: uploaded });
    } catch (err) {
        console.error("Error uploading design to Drive:", err);
        res.status(500).json({ msg: "שגיאה בשמירת קובץ העיצוב בענן" });
    }
};
