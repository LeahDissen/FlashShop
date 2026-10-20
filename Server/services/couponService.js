/** Coupons at checkout: general coupons and club members' codes (legacy 15%, join gift) */
const { CouponModel } = require("../models/couponModel");
const { ClubModel } = require("../models/clubModel");
const { isSameUser } = require("../utils/ownership");

/**
 * The coupon's discount on a subtotal, or { error } for a code that cannot be used.
 * applyTo(amount) prices the coupon on another amount (the order applies it after the club discounts).
 */
async function calculateCouponDiscount(couponCode, userId, subtotal) {
    if (!couponCode) {
        return { discount: 0 };
    }

    // 1. Check for a general coupon in the system
    const generalCoupon = await CouponModel.findOne({ code: couponCode });

    if (generalCoupon) {
        if (!generalCoupon.isActive) {
            return { error: "הקופון אינו פעיל" };
        }
        if (generalCoupon.expirationDate && new Date() > new Date(generalCoupon.expirationDate)) {
            return { error: "תוקף הקופון פג" };
        }
        if (userId && generalCoupon.usedBy.some((id) => isSameUser(id, userId))) {
            return { error: "כבר השתמשת בקופון זה בעבר" };
        }

        // applyTo: the coupon's discount on an amount (the order prices it after the club discounts)
        const applyTo = (amount) => {
            let discount = 0;
            if (generalCoupon.type === "percent") {
                discount = amount * (generalCoupon.value / 100);
            } else if (generalCoupon.type === "fixed") {
                discount = generalCoupon.value;
            }
            return Math.min(discount, amount);
        };

        return { discount: applyTo(subtotal), applyTo, couponType: "general" };
    }

    // 2. Check a club member's benefit code
    const member = await ClubModel.findOne({ giftCode: couponCode });
    if (member) {
        if (member.isUsed) {
            return { error: "הקוד הזה כבר נוצל בעבר" };
        }
        if (member.giftType === "join-gift") {
            // The join gift is a product discount, calculated with the club discounts
            return { discount: 0, couponType: "club-gift", giftMember: member };
        }
        if (member.giftType === "none") {
            return { error: "קופון לא תקין" };
        }
        if (member.giftType === "pending-gift") {
            return { error: "כדי לקבל את המתנה יש לאשר קודם את המייל שנשלח אלייך" };
        }
        // A code sent before the join gift existed keeps its 15% off the order
        const applyTo = (amount) => Math.min(amount * 0.15, amount);
        return { discount: applyTo(subtotal), applyTo, couponType: "club" };
    }

    return { error: "קופון לא תקין" };
}

/** Marks the coupon as used once the order is paid */
async function markCouponAsUsed(couponCode, userId) {
    if (!couponCode || !userId) return;

    const generalCoupon = await CouponModel.findOne({ code: couponCode });
    if (generalCoupon) {
        if (!generalCoupon.usedBy.some((id) => isSameUser(id, userId))) {
            generalCoupon.usedBy.push(userId);
            await generalCoupon.save();
        }
        return;
    }

    // A join-gift code is used only when its gift was given (order.clubGiftMemberId, in completeOrder)
    await ClubModel.findOneAndUpdate({ giftCode: couponCode, giftType: { $ne: "join-gift" } }, { isUsed: true });
}

module.exports = { calculateCouponDiscount, markCouponAsUsed };
