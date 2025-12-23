const mongoose = require("mongoose");

const catalogSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: Buffer,
    updatedAt: { type: Date, default: Date.now }
});

exports.CatalogModel = mongoose.model("Catalog", catalogSchema);