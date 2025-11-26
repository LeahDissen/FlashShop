const mongoose = require("mongoose");

const tipsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        img: { type: String, required: true },
        summary: { type: String, required: true },
        content: { type: String, required: true },
    },
    {
        timestamps: true
    }
);

exports.TipsModel = mongoose.model("Tips", tipsSchema);