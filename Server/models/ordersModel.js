const mongoose = require("mongoose");
const Joi = require("joi");
let orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' }
        , quantity: Number,
        img: [{
            data: Buffer,
            contentType: String
        }
        ]
    }],
    total_price: Number,
    status: {
        type: String, default: "pending"
    },
    date_created: {
        type: Date,
        default: Date.now
    }
});
exports.OrderModel = mongoose.model("orders", orderSchema);
   