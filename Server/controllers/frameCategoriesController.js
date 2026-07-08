const { FrameCategoryModel } = require("../models/frameCategoryModel");
const { DesignFrameModel } = require("../models/designFrameModel");

const DEFAULT_CATEGORIES = ["כללי", "חגים", "קיץ", "ימי הולדת", "משפחה", "אהבה"];

const seedDefaultCategories = async () => {
    const count = await FrameCategoryModel.countDocuments();
    if (count > 0) return;

    await FrameCategoryModel.insertMany(
        DEFAULT_CATEGORIES.map((name, index) => ({ name, sortOrder: index })),
    );
};

exports.getAllFrameCategories = async (req, res) => {
    try {
        await seedDefaultCategories();
        const categories = await FrameCategoryModel.find({}).sort({ sortOrder: 1, name: 1 });
        res.json(categories);
    } catch (err) {
        console.error("Error fetching frame categories:", err);
        res.status(500).json({ msg: "שגיאה בטעינת קטגוריות" });
    }
};

exports.addFrameCategory = async (req, res) => {
    try {
        const name = req.body?.name?.trim();
        if (!name) {
            return res.status(400).json({ msg: "יש להזין שם קטגוריה" });
        }

        const existing = await FrameCategoryModel.findOne({ name });
        if (existing) {
            return res.status(400).json({ msg: "קטגוריה זו כבר קיימת" });
        }

        const sortOrder = Number(req.body?.sortOrder) || 0;
        const category = new FrameCategoryModel({ name, sortOrder });
        await category.save();
        res.status(201).json(category);
    } catch (err) {
        console.error("Error adding frame category:", err);
        res.status(500).json({ msg: "שגיאה בהוספת קטגוריה" });
    }
};

exports.updateFrameCategory = async (req, res) => {
    try {
        const name = req.body?.name?.trim();
        if (!name) {
            return res.status(400).json({ msg: "יש להזין שם קטגוריה" });
        }

        const current = await FrameCategoryModel.findById(req.params.id);
        if (!current) {
            return res.status(404).json({ msg: "קטגוריה לא נמצאה" });
        }

        const duplicate = await FrameCategoryModel.findOne({ name, _id: { $ne: req.params.id } });
        if (duplicate) {
            return res.status(400).json({ msg: "קטגוריה זו כבר קיימת" });
        }

        const oldName = current.name;
        current.name = name;
        if (req.body?.sortOrder !== undefined) {
            current.sortOrder = Number(req.body.sortOrder) || 0;
        }
        await current.save();

        if (oldName !== name) {
            await DesignFrameModel.updateMany({ category: oldName }, { category: name });
        }

        res.json(current);
    } catch (err) {
        console.error("Error updating frame category:", err);
        res.status(500).json({ msg: "שגיאה בעדכון קטגוריה" });
    }
};

exports.deleteFrameCategory = async (req, res) => {
    try {
        const category = await FrameCategoryModel.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ msg: "קטגוריה לא נמצאה" });
        }

        const framesUsing = await DesignFrameModel.countDocuments({ category: category.name });
        if (framesUsing > 0) {
            return res.status(400).json({
                msg: `לא ניתן למחוק – ${framesUsing} מסגרות משויכות לקטגוריה זו`,
            });
        }

        await FrameCategoryModel.findByIdAndDelete(req.params.id);
        res.json({ msg: "הקטגוריה נמחקה בהצלחה" });
    } catch (err) {
        console.error("Error deleting frame category:", err);
        res.status(500).json({ msg: "שגיאה במחיקת קטגוריה" });
    }
};
