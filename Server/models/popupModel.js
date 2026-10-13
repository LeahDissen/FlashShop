const mongoose = require("mongoose");

/**
 * פופאפ שהמנהלת מגדירה בלוח הבקרה: מבצע, הודעה חשובה, קורס וכו'.
 * pages ריק = מופיע בכל האתר; אחרת רשימת נתיבים (למשל "/", "/products").
 */
const popupSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        body: { type: String, default: "", trim: true },
        imageUrl: { type: String, default: "", trim: true },
        ctaText: { type: String, default: "", trim: true },
        ctaUrl: { type: String, default: "", trim: true },
        pages: { type: [String], default: [] },
        /** כמה שניות אחרי הכניסה לעמוד הפופאפ עולה */
        delaySeconds: { type: Number, default: 3, min: 0, max: 600 },
        /** פעם אחת בביקור (session) או בכל כניסה לעמוד */
        showOncePerSession: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        startsAt: { type: Date },
        endsAt: { type: Date },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true },
);

exports.PopupModel = mongoose.model("Popup", popupSchema);
