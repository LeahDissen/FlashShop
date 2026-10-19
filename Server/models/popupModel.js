const mongoose = require("mongoose");

/**
 * Popup the admin defines in the dashboard: a sale, an important notice, a course, etc.
 * Empty pages = shown on the whole site; otherwise a list of paths (e.g. "/", "/products").
 */
const popupSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        body: { type: String, default: "", trim: true },
        imageUrl: { type: String, default: "", trim: true },
        ctaText: { type: String, default: "", trim: true },
        ctaUrl: { type: String, default: "", trim: true },
        pages: { type: [String], default: [] },
        /** How many seconds after entering the page the popup appears */
        delaySeconds: { type: Number, default: 3, min: 0, max: 600 },
        /** Once per visit (session) or on every page visit */
        showOncePerSession: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
        startsAt: { type: Date },
        endsAt: { type: Date },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true },
);

exports.PopupModel = mongoose.model("Popup", popupSchema);
