const mongoose = require("mongoose");

let clubSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    birthDate: {
        type: Date,
        required: false
    },
    giftCode: {
        type: String,
        required: true,
        unique: true
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

exports.ClubModel = mongoose.model("clubMembers", clubSchema);