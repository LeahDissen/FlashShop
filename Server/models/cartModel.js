const mongoose = require("mongoose");
const Joi = require("joi");

let cartSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'products' },
        quantity: Number
    }]
});
exports.Cart = mongoose.model("Cart", cartSchema);

function validateCart(cart) {
    const schema = Joi.object({
        user_id: Joi.string().required(),
        items: Joi.array().items(
            Joi.object({
                productId: Joi.string().required(),
                quantity: Joi.number().min(1).required()
            })
        )
    });
    return schema.validate(cart);
}

