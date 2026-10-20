const mongoose = require("mongoose");

let clubSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
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
    /**
     * What the gift code gives: "join-gift" = the join gift product (shop settings), "none" = nothing.
     * Empty = a member from before the join gift, whose code still gives 15% off the order.
     */
    giftType: {
        type: String,
        enum: ["join-gift", "none"],
        required: false
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    /** Asked to be removed from the mailing list – receives no marketing emails */
    unsubscribed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

exports.ClubModel = mongoose.model("clubMembers", clubSchema);