const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    status: {
        type: String,
        default: "pending"
    }
}, { timestamps: true });

contactSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days in seconds

exports.ContactModel = mongoose.model("Contact", contactSchema);
