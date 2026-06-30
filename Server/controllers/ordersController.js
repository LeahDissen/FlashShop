const mongoose = require("mongoose");
const { OrderModel } = require("../models/ordersModel");
const { CouponModel } = require("../models/couponModel");
const { ClubModel } = require("../models/clubModel");
const { ProductModel } = require("../models/productModel"); // יבוא מודל המוצרים לאימות מחירים
const { getUnitPriceByQuantity, isPhotoPrintItem } = require("../utils/photoQuantityPricing");
const { getUnitPriceForQuantity } = require("../utils/productQuantityPricing");

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === String(id);

const extractProductIdFromLineId = (lineId) => {
    if (!lineId || typeof lineId !== "string") return null;
    const match = lineId.match(/^([a-f0-9]{24})-/i);
    return match ? match[1] : null;
};

const resolveProductId = (item) => {
    const candidates = [
        item.productId,
        item.product_id,
        item._id,
        extractProductIdFromLineId(item.id),
    ];
    for (const id of candidates) {
        if (isValidObjectId(String(id))) {
            return String(id);
        }
    }
    return null;
};

// פונקציית עזר להשוואת מזהים (ObjectIds) בצורה בטוחה
const isSameUser = (a, b) => String(a) === String(b);

const sanitizeCartItem = (item) => {
    const sanitized = {
        name: item.name,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        image: item.image,
        itemType: item.itemType,
    };
    const rawId = resolveProductId(item);
    if (isValidObjectId(rawId)) {
        sanitized.productId = rawId;
    }
    return sanitized;
};

// פונקציית עזר לבדיקת הרשאות (המשתמש עצמו או אדמין)
const ensureSelfOrAdmin = (req, res, userId) => {
    if (!isSameUser(req.tokenData._id, userId) && req.tokenData.role !== "admin") {
        res.status(403).json({ msg: "אין הרשאה לצפות במידע זה" });
        return false;
    }
    return true;
};

// חישוב הנחת קופון (כללי או מועדון)
async function calculateCouponDiscount(couponCode, userId, subtotal) {
    if (!couponCode) {
        return { discount: 0 };
    }

    // 1. בדיקת קופון כללי במערכת
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

        let discount = 0;
        if (generalCoupon.type === "percent") {
            discount = subtotal * (generalCoupon.value / 100);
        } else if (generalCoupon.type === "fixed") {
            discount = generalCoupon.value;
        }

        return { discount: Math.min(discount, subtotal), couponType: "general" };
    }

    // 2. בדיקת קוד הטבה של חבר מועדון
    const member = await ClubModel.findOne({ giftCode: couponCode });
    if (member) {
        if (member.isUsed) {
            return { error: "הקוד הזה כבר נוצל בעבר" };
        }
        const discount = subtotal * 0.15; // 15% הנחת מועדון קבועה
        return { discount: Math.min(discount, subtotal), couponType: "club" };
    }

    return { error: "קופון לא תקין" };
}

// סימון קופון כמשומש לאחר רכישה מוצלחת
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

    await ClubModel.findOneAndUpdate({ giftCode: couponCode }, { isUsed: true });
}

// ============================================================================
// ראוטים (Route Handlers)
// ============================================================================

// שליפת הזמנה זמנית (עגלת קניות) של משתמש ספציפי
exports.getPendingOrderForUser = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ensureSelfOrAdmin(req, res, userId)) return;

        const orders = await OrderModel.find({ user_id: userId, status: "pending" });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// שליפת כל ההזמנות במערכת (לאדמין בלבד - יש לוודא חסימה גם ב-Router עצמו)
exports.getOrders = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "גישה מורשית למנהלים בלבד" });
        }
        const orders = await OrderModel.find({ status: { $ne: "pending" } })
            .populate("user_id", "name email")
            .sort({ date_created: -1 });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// שליפת היסטוריית הזמנות (סגורות) של משתמש ספציפי
exports.getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ensureSelfOrAdmin(req, res, userId)) return;

        const orders = await OrderModel.find({
            user_id: userId,
            status: { $ne: "pending" },
        }).sort({ date_created: -1 });

        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// עדכון/סנכרון עגלת הקניות הזמנית של המשתמש מה-Frontend
exports.updateOrder = async (req, res) => {
    try {
        // עדיף להשתמש ב-ID מהטוקן המאובטח למניעת מניפולציות URL
        const userId = req.tokenData._id; 

        const newItems = (req.body.items || []).map(sanitizeCartItem);
        const newTotalPrice = req.body.total_price ?? 0;

        const order = await OrderModel.findOneAndUpdate(
            { user_id: userId, status: "pending" },
            {
                $set: {
                    items: newItems,
                    total_price: newTotalPrice,
                    subtotal: newTotalPrice,
                    discount: 0,
                    coupon_code: null,
                    date_created: Date.now(),
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error updating cart" });
    }
};

// עדכון סטטוס הזמנה (מאובטח - אדמין בלבד!)
exports.updateOrderStatus = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "אין הרשאה לעדכן סטטוס הזמנה זו" });
        }

        const { id } = req.params;
        const { status } = req.body;

        const order = await OrderModel.findOneAndUpdate(
            { _id: id },
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בעדכון סטטוס ההזמנה" });
    }
};

// יצירת הזמנה חדשה וסגירת עגלת הקניות (מאובטח לחלוטין מפני זיוף מחירים)
exports.createOrder = async (req, res) => {
    try {
        const userId = req.tokenData._id;
        const { items, couponCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: "העגלה ריקה" });
        }

        // --- אבטחה: חישוב מחיר אמין לפי סוג הפריט ---
        let subtotal = 0;
        const verifiedItems = [];

        const photoItems = items.filter(isPhotoPrintItem);
        const totalPhotoPrints = photoItems.reduce(
            (sum, item) => sum + (Number(item.quantity) || 1),
            0,
        );
        const photoUnitPrice = getUnitPriceByQuantity(totalPhotoPrints);

        for (const item of items) {
            const qty = Number(item.quantity) || 1;
            const productId = resolveProductId(item);

            if (productId) {
                const product = await ProductModel.findById(productId);
                if (!product) {
                    const cartPrice = Number(item.price);
                    if (cartPrice > 0 && item.name) {
                        subtotal += cartPrice * qty;
                        verifiedItems.push({
                            name: item.name,
                            size: item.size,
                            price: cartPrice,
                            quantity: qty,
                            image: item.image,
                        });
                        continue;
                    }
                    return res.status(404).json({ msg: "המוצר המבוקש לא נמצא במערכת" });
                }

                let unitPrice = getUnitPriceForQuantity(product, qty);
                let name = product.name;
                let image = product.image;

                if (item.customDesign || item.customization) {
                    const cartPrice = Number(item.price);
                    if (cartPrice > 0) unitPrice = cartPrice;
                    if (item.name) name = item.name;
                    if (item.image) image = item.image;
                }

                subtotal += unitPrice * qty;
                verifiedItems.push({
                    productId: product._id,
                    name,
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image,
                });
                continue;
            }

            if (isPhotoPrintItem(item)) {
                const cartPrice = Number(item.price);
                if (!cartPrice || Math.abs(cartPrice - photoUnitPrice) > 0.01) {
                    return res.status(400).json({ msg: "מחיר הדפסת תמונה אינו תקין" });
                }

                subtotal += photoUnitPrice * qty;
                verifiedItems.push({
                    name: item.name,
                    size: item.size,
                    price: photoUnitPrice,
                    quantity: qty,
                    image: typeof item.image === "string" && item.image.length > 500_000
                        ? null
                        : item.image,
                });
                continue;
            }

            if (item.customDesign) {
                const unitPrice = Number(item.price);
                if (!unitPrice || unitPrice <= 0) {
                    return res.status(400).json({ msg: "מחיר פריט עיצוב אישי אינו תקין" });
                }

                subtotal += unitPrice * qty;
                verifiedItems.push({
                    name: item.name || "מוצר בעיצוב אישי",
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image: item.image,
                });
                continue;
            }

            if (item.customization && Number(item.price) > 0 && item.name) {
                const unitPrice = Number(item.price);
                subtotal += unitPrice * qty;
                verifiedItems.push({
                    name: item.name,
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image: item.image,
                });
                continue;
            }

            if (item.name && Number(item.price) > 0) {
                const unitPrice = Number(item.price);
                subtotal += unitPrice * qty;
                verifiedItems.push({
                    name: item.name,
                    size: item.size,
                    price: unitPrice,
                    quantity: qty,
                    image: item.image,
                });
                continue;
            }

            return res.status(400).json({
                msg: `פריט לא תקין בעגלה: ${item.name || "ללא שם"}`,
            });
        }
        // ----------------==================================----------------

        // חישוב הנחה על בסיס ה-subtotal המאומת
        const couponResult = await calculateCouponDiscount(couponCode, userId, subtotal);
        if (couponResult.error) {
            return res.status(400).json({ msg: couponResult.error });
        }

        const discount = couponResult.discount || 0;
        const total_price = Math.max(0, subtotal - discount);

        // יצירת ההזמנה החדשה בסטטוס processing
        const newOrder = new OrderModel({
            user_id: userId,
            items: verifiedItems,
            subtotal,
            discount,
            coupon_code: couponCode || undefined,
            total_price,
            status: "processing",
        });

        const saved = await newOrder.save();

        // מימוש הקופון במידה וקיים
        if (couponCode) {
            await markCouponAsUsed(couponCode, userId);
        }

        // איפוס וניקוי עגלת הקניות הזמנית (pending) של המשתמש
        await OrderModel.findOneAndUpdate(
            { user_id: userId, status: "pending" },
            {
                $set: {
                    items: [],
                    total_price: 0,
                    subtotal: 0,
                    discount: 0,
                    coupon_code: null,
                },
            }
        );

        res.status(201).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה ביצירת ההזמנה" });
    }
};

// שליפת מידע על הזמנה ספציפית לפי ה-ID שלה
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findById(id).populate("user_id", "name email");

        if (!order) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        // בדיקה שרק בעל ההזמנה או אדמין יכולים לצפות בה
        if (
            !isSameUser(req.tokenData._id, order.user_id?._id ?? order.user_id) &&
            req.tokenData.role !== "admin"
        ) {
            return res.status(403).json({ msg: "אין הרשאה לצפות בהזמנה זו" });
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת ההזמנה" });
    }
};