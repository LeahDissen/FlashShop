const mongoose = require("mongoose");

const tipsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        img: { type: String, required: true },
        summary: { type: String, required: true },
        content: { type: String, required: true },
        /** The images of the tip's body: a "[[תמונה N]]" line in the content shows images[N-1] there; the rest are shown after the text */
        images: { type: [String], default: undefined },
    },
    {
        timestamps: true
    }
);

exports.TipsModel = mongoose.model("Tips", tipsSchema);