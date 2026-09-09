const { EditorAssetModel, CATEGORIES } = require("../models/editorAssetModel");
const { DEFAULT_EDITOR_ASSETS, svgToDataURL } = require("../data/editorAssetDefaults");

const HEX_COLOR = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const seedDefaultAssets = async () => {
    const count = await EditorAssetModel.countDocuments();
    if (count > 0) return { inserted: 0, skipped: true };

    await EditorAssetModel.insertMany(DEFAULT_EDITOR_ASSETS);
    return { inserted: DEFAULT_EDITOR_ASSETS.length, skipped: false };
};

const upsertDefaultAssets = async () => {
    let inserted = 0;
    let updated = 0;

    for (const asset of DEFAULT_EDITOR_ASSETS) {
        const result = await EditorAssetModel.updateOne(
            { seedKey: asset.seedKey },
            { $setOnInsert: asset },
            { upsert: true },
        );
        if (result.upsertedCount) inserted += 1;
        else updated += 1;
    }

    return { inserted, unchanged: updated, total: DEFAULT_EDITOR_ASSETS.length };
};

const normalizeAssetPayload = (body = {}, { partial = false } = {}) => {
    const updates = {};

    if (body.category !== undefined || !partial) {
        const category = String(body.category || "").trim();
        if (!CATEGORIES.includes(category)) {
            return { error: "יש לבחור קטגוריה תקינה" };
        }
        updates.category = category;
    }

    if (body.title !== undefined || !partial) {
        const title = String(body.title || "").trim();
        if (!title) {
            return { error: "יש להזין שם לפריט" };
        }
        updates.title = title;
    }

    if (body.src !== undefined) updates.src = String(body.src || "").trim();
    if (body.content !== undefined) updates.content = String(body.content || "");
    if (body.colorClass !== undefined) updates.colorClass = String(body.colorClass || "").trim();
    if (body.isActive !== undefined) updates.isActive = body.isActive !== false;
    if (body.sortOrder !== undefined) updates.sortOrder = Number(body.sortOrder) || 0;

    if (body.colorValue !== undefined) {
        const colorValue = String(body.colorValue || "").trim().toUpperCase();
        if (colorValue && !HEX_COLOR.test(colorValue)) {
            return { error: "צבע רקע חייב להיות בפורמט hex תקין" };
        }
        updates.colorValue = colorValue;
    }

    const category = updates.category || body.existingCategory;
    const resolvedType = body.type
        || (category === "shape" ? "shape" : category === "color" ? "color" : "image");

    if (body.type !== undefined || updates.category) {
        updates.type = resolvedType;
    }

    const type = updates.type || body.existingType;
    const content = updates.content ?? body.content;
    if (type === "shape" && content && !(updates.src ?? body.src)) {
        updates.src = svgToDataURL(content);
    }
    if (!partial || updates.category || body.type !== undefined || body.src !== undefined || body.content !== undefined || body.colorValue !== undefined) {
        if (type === "shape" && !(updates.content ?? body.content)) {
            return { error: "לצורה יש להזין תוכן SVG" };
        }
        if (type === "color") {
            const colorValue = updates.colorValue ?? body.colorValue;
            if (!colorValue || !HEX_COLOR.test(String(colorValue))) {
                return { error: "לצבע רקע יש להזין ערך hex תקין" };
            }
        }
        if (type === "image" && !(updates.src ?? body.src)) {
            return { error: "יש להזין תמונה או כתובת מקור לפריט" };
        }
    }

    return { updates };
};

exports.seedDefaultAssets = seedDefaultAssets;
exports.upsertDefaultAssets = upsertDefaultAssets;

exports.getAllEditorAssets = async (req, res) => {
    try {
        await seedDefaultAssets();

        const includeInactive = req.query.includeInactive === "true";
        const filter = includeInactive ? {} : { isActive: true };
        const category = req.query.category?.trim();
        if (category) {
            if (!CATEGORIES.includes(category)) {
                return res.status(400).json({ msg: "קטגוריה לא תקינה" });
            }
            filter.category = category;
        }

        const assets = await EditorAssetModel.find(filter).sort({ category: 1, sortOrder: 1, createdAt: 1 });
        res.json(assets);
    } catch (err) {
        console.error("Error fetching editor assets:", err);
        res.status(500).json({ msg: "שגיאה בטעינת רכיבי העורך" });
    }
};

exports.addEditorAsset = async (req, res) => {
    try {
        const { updates, error } = normalizeAssetPayload(req.body, { partial: false });
        if (error) {
            return res.status(400).json({ msg: error });
        }

        const asset = new EditorAssetModel({
            ...updates,
            src: updates.src || "",
            content: updates.content || "",
            colorValue: updates.colorValue || "",
            colorClass: updates.colorClass || "",
            isActive: updates.isActive !== false,
            sortOrder: updates.sortOrder || 0,
        });
        await asset.save();
        res.status(201).json(asset);
    } catch (err) {
        console.error("Error adding editor asset:", err);
        res.status(500).json({ msg: "שגיאה בהוספת רכיב לעורך" });
    }
};

exports.updateEditorAsset = async (req, res) => {
    try {
        const current = await EditorAssetModel.findById(req.params.id);
        if (!current) {
            return res.status(404).json({ msg: "הרכיב לא נמצא" });
        }

        const { updates, error } = normalizeAssetPayload(
            {
                ...req.body,
                existingCategory: current.category,
                existingType: current.type,
                src: req.body?.src !== undefined ? req.body.src : current.src,
                content: req.body?.content !== undefined ? req.body.content : current.content,
                colorValue: req.body?.colorValue !== undefined ? req.body.colorValue : current.colorValue,
            },
            { partial: true },
        );
        if (error) {
            return res.status(400).json({ msg: error });
        }

        Object.assign(current, updates);
        await current.save();
        res.json(current);
    } catch (err) {
        console.error("Error updating editor asset:", err);
        res.status(500).json({ msg: "שגיאה בעדכון רכיב העורך" });
    }
};

exports.deleteEditorAsset = async (req, res) => {
    try {
        const deleted = await EditorAssetModel.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ msg: "הרכיב לא נמצא" });
        }
        res.json({ msg: "הרכיב נמחק בהצלחה" });
    } catch (err) {
        console.error("Error deleting editor asset:", err);
        res.status(500).json({ msg: "שגיאה במחיקת רכיב העורך" });
    }
};
