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
    /** תיקיית Google Drive שנוצרה להזמנה עם קבצי העיצוב הסופיים */
    drive: {
        folderId: { type: String },
        folderName: { type: String },
        folderUrl: { type: String },
        fileCount: { type: Number },
        uploadedAt: { type: Date },
    },
    total_price: Number,
    status: {
        type: String,
        default: "pending"
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});

exports.OrderModel = mongoose.model("orders", orderSchema);