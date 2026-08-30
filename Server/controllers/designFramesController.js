const { DesignFrameModel } = require("../models/designFrameModel");

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

const ratioFromDimensions = (width, height) => {
    const w = Math.round(width);
    const h = Math.round(height);
    if (!w || !h) return "1:1";
    const divisor = gcd(w, h);
    return `${w / divisor}:${h / divisor}`;
};

const normalizeDropzones = (dropzones) => {
    if (!Array.isArray(dropzones)) return [];
    return dropzones
        .map((zone, index) => ({
            id: String(zone?.id || `zone_${index + 1}`).trim(),
            x: Math.min(100, Math.max(0, Number(zone?.x) || 0)),
            y: Math.min(100, Math.max(0, Number(zone?.y) || 0)),
            width: Math.min(100, Math.max(1, Number(zone?.width) || 10)),
            height: Math.min(100, Math.max(1, Number(zone?.height) || 10)),
            clipType: zone?.clipType || "rect",
            clipPath: zone?.clipPath || "",
            label: zone?.label || `חלון ${index + 1}`,
        }))
        .filter((zone) => zone.id);
};

const resolveLayoutFields = (body = {}) => {
    const layoutType = body.layoutType === "multi_dropzone" ? "multi_dropzone" : "single_overlay";
    const dropzones = layoutType === "multi_dropzone" ? normalizeDropzones(body.dropzones) : [];

    if (layoutType === "multi_dropzone" && dropzones.length === 0) {
        return { error: "למסגרת קולאז׳ יש להגדיר לפחות חלון תמונה אחד" };
    }

    return { layoutType, dropzones };
};

exports.getAllDesignFrames = async (req, res) => {
    try {
        const includeInactive = req.query.includeInactive === "true";
        const filter = includeInactive ? {} : { isActive: true };
        const frames = await DesignFrameModel.find(filter).sort({ sortOrder: 1, createdAt: -1 });
        res.json(frames);
    } catch (err) {
        console.error("Error fetching design frames:", err);
        res.status(500).json({ msg: "שגיאה בטעינת מסגרות העיצוב" });
    }
};

exports.addDesignFrame = async (req, res) => {
    try {
        const title = req.body?.title?.trim();
        const imageUrl = req.body?.imageUrl?.trim();
        const thumbnailUrl = req.body?.thumbnailUrl?.trim() || imageUrl;
        const category = req.body?.category?.trim() || "כללי";
        const aspectRatio = req.body?.aspectRatio?.trim();
        const isActive = req.body?.isActive !== false;
        const sortOrder = Number(req.body?.sortOrder) || 0;

        if (!title) {
            return res.status(400).json({ msg: "יש להזין שם למסגרת" });
        }
        if (!imageUrl) {
            return res.status(400).json({ msg: "יש להזין כתובת תמונה למסגרת" });
        }
        if (!aspectRatio) {
            return res.status(400).json({ msg: "יש לציין יחס גובה-רוחב למסגרת" });
        }

        const layout = resolveLayoutFields(req.body);
        if (layout.error) {
            return res.status(400).json({ msg: layout.error });
        }

        const frame = new DesignFrameModel({
            title,
            imageUrl,
            thumbnailUrl,
            category,
            aspectRatio,
            layoutType: layout.layoutType,
            dropzones: layout.dropzones,
            isActive,
            sortOrder,
        });
        await frame.save();
        res.status(201).json(frame);
    } catch (err) {
        console.error("Error adding design frame:", err);
        res.status(500).json({ msg: "שגיאה בהוספת מסגרת" });
    }
};

exports.updateDesignFrame = async (req, res) => {
    try {
        const updates = {};

        if (req.body?.title !== undefined) updates.title = req.body.title.trim();
        if (req.body?.imageUrl !== undefined) updates.imageUrl = req.body.imageUrl.trim();
        if (req.body?.thumbnailUrl !== undefined) updates.thumbnailUrl = req.body.thumbnailUrl.trim();
        if (req.body?.category !== undefined) updates.category = req.body.category.trim();
        if (req.body?.aspectRatio !== undefined) updates.aspectRatio = req.body.aspectRatio.trim();
        if (req.body?.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);
        if (req.body?.sortOrder !== undefined) updates.sortOrder = Number(req.body.sortOrder) || 0;

        if (req.body?.layoutType !== undefined || req.body?.dropzones !== undefined) {
            const layout = resolveLayoutFields({
                layoutType: req.body.layoutType,
                dropzones: req.body.dropzones,
            });
            if (layout.error) {
                return res.status(400).json({ msg: layout.error });
            }
            updates.layoutType = layout.layoutType;
            updates.dropzones = layout.dropzones;
        }

        const frame = await DesignFrameModel.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!frame) {
            return res.status(404).json({ msg: "מסגרת לא נמצאה" });
        }
        res.json(frame);
    } catch (err) {
        console.error("Error updating design frame:", err);
        res.status(500).json({ msg: "שגיאה בעדכון מסגרת" });
    }
};

exports.deleteDesignFrame = async (req, res) => {
    try {
        const deleted = await DesignFrameModel.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ msg: "מסגרת לא נמצאה" });
        }
        res.json({ msg: "המסגרת נמחקה בהצלחה" });
    } catch (err) {
        console.error("Error deleting design frame:", err);
        res.status(500).json({ msg: "שגיאה במחיקת מסגרת" });
    }
};

exports.calculateAspectRatio = async (req, res) => {
    try {
        const width = Number(req.body?.width);
        const height = Number(req.body?.height);
        if (!width || !height) {
            return res.status(400).json({ msg: "יש לספק רוחב וגובה תקינים" });
        }
        res.json({ aspectRatio: ratioFromDimensions(width, height) });
    } catch (err) {
        console.error("Error calculating aspect ratio:", err);
        res.status(500).json({ msg: "שגיאה בחישוב יחס גובה-רוחב" });
    }
};
