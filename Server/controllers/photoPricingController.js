const { PhotoPricingModel } = require("../models/photoPricingModel");
const { loadPhotoPricing, validatePhotoPricing } = require("../services/photoPricingService");

exports.getPricing = async (req, res) => {
    try {
        res.json(await loadPhotoPricing());
    } catch (err) {
        console.error("get photo pricing error:", err);
        res.status(500).json({ msg: "שגיאה בטעינת מחירי פיתוח התמונות" });
    }
};

exports.updatePricing = async (req, res) => {
    try {
        const { value, error } = validatePhotoPricing(req.body);
        if (error) return res.status(400).json({ msg: error });

        // quantityTiers הוא שדה של המבנה הקודם; מוחק אותו כדי שהמסמך יישאר במבנה אחד
        await PhotoPricingModel.findOneAndUpdate(
            { key: "default" },
            { $set: value, $unset: { quantityTiers: 1 }, $setOnInsert: { key: "default" } },
            { upsert: true, strict: false },
        );
        res.json(value);
    } catch (err) {
        console.error("update photo pricing error:", err);
        res.status(500).json({ msg: "שגיאה בשמירת מחירי פיתוח התמונות" });
    }
};
