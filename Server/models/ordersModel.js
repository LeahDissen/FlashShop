const mongoose = require("mongoose");

let orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    items: [{
        id: String,
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: false },
        name: String,
        size: String,
        quantity: Number,
        price: Number,
        image: String,
        itemType: String,
        customDesign: { type: mongoose.Schema.Types.Mixed },
        customization: { type: mongoose.Schema.Types.Mixed },
    }],
    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    coupon_code: { type: String },
    /** The Google Drive folder created for the order with the final design files */
    drive: {
        folderId: { type: String },
        folderName: { type: String },
        folderUrl: { type: String },
        fileCount: { type: Number },
        uploadedAt: { type: Date },
    },
    total_price: Number,
    shipping_fee: { type: Number, default: 0 },
    fulfillment_method: {
        type: String,
        enum: ["pickup", "delivery"],
        default: "pickup",
    },
    customer: {
        name: { type: String },
        phone: { type: String },
        email: { type: String },
    },
    shipping_address: {
        city: { type: String },
        street: { type: String },
        houseNumber: { type: String },
    },
    status: {
        type: String,
        default: "pending"
    },
    /** Payment on Hyp's secure page. An order waiting for payment has the status awaiting_payment */
    payment: {
        provider: { type: String },
        status: { type: String, enum: ["pending", "paid"] },
        transactionId: { type: String },
        approvalCode: { type: String },
        paidAt: { type: Date },
    },
    /** When the status last changed – the 30-day photo retention counts from a printed/cancelled status */
    statusChangedAt: { type: Date },
    /** Set once the customer's uploaded photos were deleted from Cloudinary */
    photosPurgedAt: { type: Date },
    date_created: {
        type: Date,
        default: Date.now
    }
});

exports.OrderModel = mongoose.model("orders", orderSchema);