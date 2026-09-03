const { EditorSettingsModel } = require("../models/editorSettingsModel");

const SETTINGS_KEY = "default";

/** מידות ההדפסה שמופיעות כתיקיות מסגרות בעורך – ניתנות לשינוי מלוח הבקרה */
const DEFAULT_PRINT_SIZES = [
    { key: "10x15", label: "10×15 ס״מ", widthCm: 10, heightCm: 15, sortOrder: 0, isActive: true },
    { key: "13x18", label: "13×18 ס״מ", widthCm: 13, heightCm: 18, sortOrder: 1, isActive: true },
    { key: "15x20", label: "15×20 ס״מ", widthCm: 15, heightCm: 20, sortOrder: 2, isActive: true },
];

const DEFAULT_FONTS = [
    { label: "Arial", value: "Arial" },
    { label: "Rubik", value: "Rubik" },
    { label: "Varela Round", value: "Varela Round" },
    { label: "Times New Roman", value: "Times New Roman" },
    { label: "Georgia", value: "Georgia" },
    { label: "Tahoma", value: "Tahoma" },
    { label: "Verdana", value: "Verdana" },
    { label: "Trebuchet MS", value: "Trebuchet MS" },
    { label: "Courier New", value: "Courier New" },
    { label: "Impact", value: "Impact" },
];

const DEFAULT_COLOR_PRESETS = [
    "#FFFFFF", "#E5E7EB", "#9CA3AF", "#4B5563", "#1F2937", "#000000",
    "#9333EA", "#C084FC", "#E879F9", "#F472B6", "#F87171", "#DC2626",
    "#1D4ED8", "#3B82F6", "#38BDF8", "#67E8F9", "#2DD4BF", "#10B981",
    "#FB923C", "#FBBF24", "#FDE047", "#A3E635", "#4ADE80", "#16A34A",
];

const slugifySizeKey = (value, fallback) => {
    const cleaned = String(value || "").trim().toLowerCase().replace(/\s+/g, "");
    return cleaned || fallback;
};

const normalizePrintSizes = (sizes) => {
    if (!Array.isArray(sizes)) return null;
    return sizes
        .map((size, index) => {
            const widthCm = Number(size?.widthCm);
            const heightCm = Number(size?.heightCm);
            if (!(widthCm > 0) || !(heightCm > 0)) return null;
            return {
                key: slugifySizeKey(size?.key, `${widthCm}x${heightCm}`),
                label: String(size?.label || `${widthCm}×${heightCm} ס״מ`).trim(),
                widthCm,
                heightCm,
                sortOrder: Number(size?.sortOrder) || index,
                isActive: size?.isActive !== false,
            };
        })
        .filter(Boolean);
};

const normalizeFonts = (fonts) => {
    if (!Array.isArray(fonts)) return null;
    return fonts
        .map((font) => {
            const value = String(font?.value || font?.label || "").trim();
            if (!value) return null;
            return { label: String(font?.label || value).trim(), value };
        })
        .filter(Boolean);
};

const normalizeColors = (colors) => {
    if (!Array.isArray(colors)) return null;
    return colors
        .map((color) => String(color || "").trim())
        .filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
};

const buildDefaults = () => ({
    key: SETTINGS_KEY,
    framePrintSizes: DEFAULT_PRINT_SIZES,
    textToolbar: {
        fonts: DEFAULT_FONTS,
        colorPresets: DEFAULT_COLOR_PRESETS,
        minFontSize: 8,
        maxFontSize: 200,
    },
});

/** מחזיר את מסמך ההגדרות, ויוצר אותו עם ברירות המחדל בפעם הראשונה */
const loadSettings = async () => {
    const existing = await EditorSettingsModel.findOne({ key: SETTINGS_KEY });
    if (existing) {
        // השלמת ברירות מחדל למסמכים שנשמרו לפני הוספת שדה
        let mutated = false;
        if (!existing.framePrintSizes?.length) {
            existing.framePrintSizes = DEFAULT_PRINT_SIZES;
            mutated = true;
        }
        if (!existing.textToolbar?.fonts?.length) {
            existing.textToolbar.fonts = DEFAULT_FONTS;
            mutated = true;
        }
        if (!existing.textToolbar?.colorPresets?.length) {
            existing.textToolbar.colorPresets = DEFAULT_COLOR_PRESETS;
            mutated = true;
        }
        if (mutated) await existing.save();
        return existing;
    }

    return EditorSettingsModel.create(buildDefaults());
};

exports.loadEditorSettings = loadSettings;

exports.getEditorSettings = async (req, res) => {
    try {
        const settings = await loadSettings();
        res.json(settings);
    } catch (err) {
        console.error("Error fetching editor settings:", err);
        res.status(500).json({ msg: "שגיאה בטעינת הגדרות העורך" });
    }
};

exports.updateEditorSettings = async (req, res) => {
    try {
        const settings = await loadSettings();

        const printSizes = normalizePrintSizes(req.body?.framePrintSizes);
        if (printSizes) {
            if (printSizes.length === 0) {
                return res.status(400).json({ msg: "יש להגדיר לפחות מידת הדפסה אחת" });
            }
            const keys = new Set(printSizes.map((size) => size.key));
            if (keys.size !== printSizes.length) {
                return res.status(400).json({ msg: "קיימות מידות עם אותו מזהה" });
            }
            settings.framePrintSizes = printSizes;
        }

        if (req.body?.orientationLabels) {
            const { landscape, portrait, any } = req.body.orientationLabels;
            if (landscape) settings.orientationLabels.landscape = String(landscape).trim();
            if (portrait) settings.orientationLabels.portrait = String(portrait).trim();
            if (any) settings.orientationLabels.any = String(any).trim();
        }

        if (req.body?.frameFolders) {
            ["title", "subtitle", "emptyText"].forEach((field) => {
                const value = req.body.frameFolders[field];
                if (value !== undefined) settings.frameFolders[field] = String(value).trim();
            });
        }

        if (req.body?.textToolbar) {
            const fonts = normalizeFonts(req.body.textToolbar.fonts);
            if (fonts?.length) settings.textToolbar.fonts = fonts;

            const colors = normalizeColors(req.body.textToolbar.colorPresets);
            if (colors?.length) settings.textToolbar.colorPresets = colors;

            const minFontSize = Number(req.body.textToolbar.minFontSize);
            const maxFontSize = Number(req.body.textToolbar.maxFontSize);
            if (minFontSize > 0) settings.textToolbar.minFontSize = minFontSize;
            if (maxFontSize > 0) settings.textToolbar.maxFontSize = maxFontSize;
            if (settings.textToolbar.maxFontSize <= settings.textToolbar.minFontSize) {
                return res.status(400).json({ msg: "גודל גופן מקסימלי חייב להיות גדול מהמינימלי" });
            }
        }

        if (req.body?.captionDefaults) {
            const caption = req.body.captionDefaults;
            ["buttonLabel", "placeholder", "fontFamily", "color"].forEach((field) => {
                if (caption[field] !== undefined) {
                    settings.captionDefaults[field] = String(caption[field]).trim();
                }
            });
            const fontSize = Number(caption.fontSize);
            if (fontSize > 0) settings.captionDefaults.fontSize = fontSize;
        }

        if (req.body?.orientationPrompt) {
            ["title", "body", "rotateLabel", "dismissLabel"].forEach((field) => {
                const value = req.body.orientationPrompt[field];
                if (value !== undefined) settings.orientationPrompt[field] = String(value).trim();
            });
        }

        if (req.body?.drive) {
            ["rootFolderName", "orderFolderTemplate"].forEach((field) => {
                const value = req.body.drive[field];
                if (value !== undefined) settings.drive[field] = String(value).trim();
            });
        }

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error("Error updating editor settings:", err);
        res.status(500).json({ msg: "שגיאה בשמירת הגדרות העורך" });
    }
};
