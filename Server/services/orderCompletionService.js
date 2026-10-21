/** An order becoming real: after its payment (or right away when payment is not connected) */
const { OrderModel } = require("../models/ordersModel");
const { ClubModel } = require("../models/clubModel");
const { markCouponAsUsed } = require("./couponService");
const { sendOrderStatusEmail } = require("./orderEmailService");
const { notifyNewOrder } = require("./shopNotifications");

/** An order whose payment page was opened and not yet paid */
const AWAITING_PAYMENT = "awaiting_payment";

/**
 * What happens when an order moves to processing: redeem the coupon, clear the cart, send the customer
 * a confirmation email and alert the shop owner ("מחכה לכם הזמנה באתר")
 */
async function completeOrder(order, userId) {
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

module.exports = { AWAITING_PAYMENT, completeOrder };
