const mongoose = require("mongoose");

/** The pages the admin edits from the dashboard (texts, images, banners) */
const PAGE_KEYS = [
    "header",
    "home",
    "about",
    "terms",
    "tips",
    "club",
    "products",
    "photos",
    "cart",
    "footer",
    "product-categories",
];

/**
 * Content of a single page: a flat set of fields (strings; lists are stored as a JSON string),
 * as the client sends and expects to receive.
 */
const pageSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, enum: PAGE_KEYS },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, minimize: false },
);

exports.PAGE_KEYS = PAGE_KEYS;
exports.PageModel = mongoose.model("Page", pageSchema);
