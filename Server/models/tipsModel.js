const mongoose = require("mongoose");

const tipsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        img: { type: String, required: true },
        summary: { type: String, required: true },
        content: { type: String, required: true },
        /** More images of the tip (e.g. imported from a Word document), shown after the text */
        images: { type: [String], default: undefined },
    },
    {
        timestamps: true
    }
);

exports.TipsModel = mongoose.model("Tips", tipsSchema);