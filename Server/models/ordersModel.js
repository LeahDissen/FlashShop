const mongoose = require("mongoose");

let orderSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    items: [{
        // Optional productId for catalog items
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products', required: false },
        name: String,     
        size: String,     
        quantity: Number,
        price: Number,    
        image: String     
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