const mongoose = require("mongoose");

const frameCategorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true },
);

exports.FrameCategoryModel = mongoose.model("FrameCategory", frameCategorySchema);
