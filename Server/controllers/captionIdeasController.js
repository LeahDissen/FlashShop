const { CaptionIdeaModel } = require("../models/captionIdeaModel");

const DEFAULT_CAPTIONS = [
    { text: "אהבה אמיתית לא נגמרת", category: "אהבה" },
    { text: "תמיד ביחד", category: "אהבה" },
    { text: "עם כל האהבה שלי", category: "אהבה" },
    { text: "המשפחה שלי – הכי גדול", category: "משפחה" },
    { text: "אמא שלי – המלכה שלי", category: "משפחה" },
    { text: "אבא הכי טוב בעולם", category: "משפחה" },
    { text: "אחותי – החברה הכי טובה", category: "משפחה" },
    { text: "יום הולדת שמח!", category: "יום הולדת" },
    { text: "מזל טוב!", category: "יום הולדת" },
    { text: "חייכו! זה מצולם", category: "מצחיק" },
    { text: "זכרונות יפים", category: "כללי" },
    { text: "לנצח בלב", category: "כללי" },
];

const seedDefaultCaptions = async () => {
    const count = await CaptionIdeaModel.countDocuments();
    if (count > 0) return;
    await CaptionIdeaModel.insertMany(DEFAULT_CAPTIONS);
};

exports.getAllCaptionIdeas = async (req, res) => {
    try {
        await seedDefaultCaptions();
        const captions = await CaptionIdeaModel.find({}).sort({ createdAt: -1 });
        res.json(captions);
    } catch (err) {
        console.error("Error fetching caption ideas:", err);
        res.status(500).json({ msg: "שגיאה בטעינת רעיונות לכיתובים" });
    }
};

exports.addCaptionIdea = async (req, res) => {
    try {
        const text = req.body?.text?.trim();
        const category = req.body?.category?.trim() || "כללי";

        if (!text) {
            return res.status(400).json({ msg: "יש להזין כיתוב" });
        }

        const caption = new CaptionIdeaModel({ text, category });
        await caption.save();
        res.status(201).json(caption);
    } catch (err) {
        console.error("Error adding caption idea:", err);
        res.status(500).json({ msg: "שגיאה בהוספת כיתוב" });
    }
};

exports.deleteCaptionIdea = async (req, res) => {
    try {
        const deleted = await CaptionIdeaModel.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ msg: "כיתוב לא נמצא" });
        }
        res.json({ msg: "הכיתוב נמחק בהצלחה" });
    } catch (err) {
        console.error("Error deleting caption idea:", err);
        res.status(500).json({ msg: "שגיאה במחיקת כיתוב" });
    }
};
