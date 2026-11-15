/** An order becoming real: after its payment (or right away when payment is not connected) */
const { OrderModel } = require("../models/ordersModel");
const { ClubModel } = require("../models/clubModel");
const { markCouponAsUsed } = require("./couponService");
const { sendOrderStatusEmail } = require("./orderEmailService");
const { notifyNewOrder } = require("./shopNotifications");
const { ProductModel } = require("../models/productModel");

/**
 * Takes the order's units off the stock of products that track stock — once per order, even when
 * the payment confirmation runs twice. A failure is logged and never blocks the order.
 */
async function deductStock(order) {
    const claimed = await OrderModel.findOneAndUpdate(
        { _id: order._id, stockDeductedAt: { $exists: false } },
        { $set: { stockDeductedAt: new Date() } },
    );
    if (!claimed) return;
    for (const item of order.items || []) {
        if (!item.productId) continue;
        const qty = Number(item.quantity) || 0;
        if (qty <= 0) continue;
        try {
            const color = item.variant?.color || "";
            const size = item.variant?.size || "";
            if (color || size) {
                await ProductModel.updateOne(
                    { _id: item.productId, trackStock: true },
                    { $inc: { "variantStock.$[v].stock": -qty } },
                    { arrayFilters: [{ "v.color": color, "v.size": size }] },
                );
            } else {
                await ProductModel.updateOne(
                    { _id: item.productId, trackStock: true, "colors.0": { $exists: false }, "sizes.0": { $exists: false } },
                    { $inc: { stock: -qty } },
                );
            }
        } catch (err) {
            console.error(`[Stock][order=${order._id}] could not update product ${item.productId}:`, err.message);
        }
    }
}

/** An order whose payment page was opened and not yet paid */
const AWAITING_PAYMENT = "awaiting_payment";

/**
 * What happens when an order moves to processing: redeem the coupon, clear the cart, send the customer
 * a confirmation email and alert the shop owner ("מחכה לכם הזמנה באתר")
 */
async function completeOrder(order, userId) {
    await deductStock(order).catch((err) => console.error(`[Stock][order=${order._id}] stock update failed:`, err.message));
    if (order.coupon_code) {
        await markCouponAsUsed(order.coupon_code, userId);
    }
    if (order.clubGiftMemberId) {
        await ClubModel.updateOne({ _id: order.clubGiftMemberId }, { $set: { isUsed: true } });
    }
    await OrderModel.findOneAndUpdate(
        { user_id: userId, status: "pending" },
        { $set: { items: [], total_price: 0, subtotal: 0, discount: 0, coupon_code: null } },
    );
    sendOrderStatusEmail(order, "processing"); // In the background, does not delay the response
    notifyNewOrder(order); // Same, and it never throws
}

module.exports = { AWAITING_PAYMENT, completeOrder, deductStock };
