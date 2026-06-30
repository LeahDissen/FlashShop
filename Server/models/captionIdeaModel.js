const mongoose = require("mongoose");

const captionIdeaSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true },
        category: { type: String, default: "כללי", trim: true },
    },
    { timestamps: true },
);

exports.CaptionIdeaModel = mongoose.model("CaptionIdea", captionIdeaSchema);
