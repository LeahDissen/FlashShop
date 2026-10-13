const { PageModel, PAGE_KEYS } = require("../models/pageModel");

const isKnownPage = (key) => PAGE_KEYS.includes(key);

exports.getPage = async (req, res) => {
    try {
        const { key } = req.params;
        if (!isKnownPage(key)) {
            return res.status(404).json({ msg: "דף לא קיים" });
        }

        const page = await PageModel.findOne({ key }).lean();
        res.json(page?.data || {});
    } catch (err) {
        console.error(`get ${req.params.key} page error:`, err);
        res.status(500).json({ msg: "שגיאה בטעינת תוכן הדף" });
    }
};

// עדכון חלקי: רק השדות שנשלחו נדרסים, השאר נשמרים
exports.updatePage = async (req, res) => {
    try {
        const { key } = req.params;
        if (!isKnownPage(key)) {
            return res.status(404).json({ msg: "דף לא קיים" });
        }

        const body = req.body && typeof req.body === "object" ? req.body : {};
        const fieldsToUpdate = Object.fromEntries(
            Object.entries(body).filter(([, value]) => value !== undefined),
        );
        const updatedFields = Object.keys(fieldsToUpdate);

        if (updatedFields.length > 0) {
            const $set = Object.fromEntries(
                updatedFields.map((field) => [`data.${field}`, fieldsToUpdate[field]]),
            );
            await PageModel.findOneAndUpdate(
                { key },
                { $set, $setOnInsert: { key } },
                { upsert: true, setDefaultsOnInsert: true },
            );
        }

        res.json({ success: true, updatedFields });
    } catch (err) {
        console.error(`update ${req.params.key} page error:`, err);
        res.status(500).json({ msg: "שגיאה בשמירת תוכן הדף" });
    }
};
