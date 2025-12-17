const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    type: { 
        type: String, 
        enum: ['percent', 'fixed'], 
        required: true 
    },
    value: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    expirationDate: { type: Date }, 
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }] 
});

exports.CouponModel = mongoose.model("coupons", couponSchema);