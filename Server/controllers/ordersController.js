/** Orders: the customer's cart, checkout (quote and create), order history and the admin's order management */
const { OrderModel } = require("../models/ordersModel");
const { ORDER_EMAIL_STATUSES } = require("../models/orderEmailTemplateModel");
const { loadShopSettings } = require("./shopSettingsController");
const { isDriveConfigured } = require("../services/googleDriveService");
const { sendOrderStatusEmail } = require("../services/orderEmailService");
const { isHypConfigured, createPaymentUrl } = require("../services/hypPaymentService");
const { priceOrder, DELIVERY_FEE } = require("../services/orderPricingService");
const { AWAITING_PAYMENT, completeOrder } = require("../services/orderCompletionService");
const { uploadPhotoPrintsToDrive, attachDriveFolderToOrder } = require("../services/orderDriveService");
const { isPhotoPrintItem } = require("../utils/photoQuantityPricing");
const { validateCheckoutDetails, firstCheckoutValidationMessage } = require("../utils/checkoutValidation");
const { sanitizeCustomerDetails, sanitizeShippingAddress, isValidObjectId, sanitizeCartItem } = require("../utils/orderItems");
const { isSameUser, ensureSelfOrAdmin } = require("../utils/ownership");

// Fetch a specific user's temporary order (shopping cart)
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

// Fetch all the orders in the system (admin only - make sure the router blocks it too)
exports.getOrders = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "גישה מורשית למנהלים בלבד" });
        }
        const orders = await OrderModel.find({ status: { $ne: "pending" } })
            .populate("user_id", "name email createdAt")
            .sort({ date_created: -1 });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// Fetch a specific user's order history (closed)
exports.getOrdersByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ensureSelfOrAdmin(req, res, userId)) return;

        const orders = await OrderModel.find({
            user_id: userId,
            status: { $ne: "pending" },
            // A payment page that was opened but never paid is not an order; a charge awaiting review is
            $nor: [{ status: AWAITING_PAYMENT, "payment.status": { $ne: "review" } }],
        }).sort({ date_created: -1 });

        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later" });
    }
};

// Update/sync the user's temporary shopping cart from the frontend
exports.updateOrder = async (req, res) => {
    try {
        // Prefer the id from the secure token to prevent URL manipulation
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

// Update an order status (secured - admin only!)
exports.updateOrderStatus = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "אין הרשאה לעדכן סטטוס הזמנה זו" });
        }

        const { id } = req.params;
        const { status } = req.body;
        if (!ORDER_EMAIL_STATUSES.includes(status)) {
            return res.status(400).json({ msg: "סטטוס לא תקין" });
        }

        const previous = await OrderModel.findById(id).select("status").lean();
        if (!previous) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        const order = await OrderModel.findOneAndUpdate(
            { _id: id },
            previous.status !== status ? { status, statusChangedAt: new Date() } : { status },
            { new: true }
        );

        // The customer gets an email on every status change (per the text the admin defined).
        // Sent in the background: the admin does not wait for the mail server, and a failure is only logged.
        if (previous.status !== status) {
            sendOrderStatusEmail(order, status);
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בעדכון סטטוס ההזמנה" });
    }
};

// Delete the selected orders (admin only — only the ids that were sent, no bulk delete)
exports.deleteOrders = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "אין הרשאה למחוק הזמנות" });
        }

        const ids = req.body?.ids;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: "יש לבחור לפחות הזמנה אחת למחיקה" });
        }
        if (ids.length > 50) {
            return res.status(400).json({ msg: "לא ניתן למחוק יותר מ-50 הזמנות בפעם אחת" });
        }

        const validIds = [...new Set(ids.map(String))].filter(isValidObjectId);
        if (validIds.length === 0) {
            return res.status(400).json({ msg: "מזהה הזמנה אינו תקין" });
        }

        const result = await OrderModel.deleteMany({
            _id: { $in: validIds },
            status: { $ne: "pending" },
        });

        res.json({ deletedCount: result.deletedCount });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה במחיקת ההזמנות" });
    }
};

exports.syncOrderDrive = async (req, res) => {
    try {
        if (req.tokenData.role !== "admin") {
            return res.status(403).json({ msg: "גישה מורשית למנהלים בלבד" });
        }
        if (!isDriveConfigured()) {
            return res.status(503).json({
                msg: "שמירה אוטומטית לתיקייה עוד לא הוגדרה. בינתיים אפשר להוריד כל תמונה בכפתור \"הורדת תמונה\".",
                code: "DRIVE_NOT_CONFIGURED",
            });
        }

        const order = await OrderModel.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ msg: "ההזמנה לא נמצאה" });
        }

        await uploadPhotoPrintsToDrive(order, { strict: true });
        await attachDriveFolderToOrder(order);

        const fresh = await OrderModel.findById(order._id).populate("user_id", "name email createdAt");
        if (!fresh?.drive?.folderUrl) {
            return res.status(500).json({
                msg: "ההעלאה ל-Drive לא הושלמה: לא נוצרה תיקייה להזמנה. בדקו הרשאות לתיקייה הראשית ושהקבצים זמינים.",
            });
        }
        res.json(fresh);
    } catch (err) {
        console.error(`[Drive][order=${req.params.id}] stage=sync failed:`, err.message);
        res.status(500).json({
            msg: err.driveUserFacing
                ? err.message
                : "שגיאה בשליחה ל-Google Drive.",
        });
    }
};

/** The price preview of the cart and checkout: the same calculation as the order, without saving anything. A guest is priced as a non-member. */
exports.quoteOrder = async (req, res) => {
    try {
        const { items, couponCode } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ msg: "העגלה ריקה" });
        }
        const pricing = await priceOrder({ items, couponCode, userId: req.tokenData?._id });
        if (pricing.error) {
            return res.status(400).json({ msg: pricing.error });
        }
        const settings = await loadShopSettings();
        res.json({
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            discounts: pricing.discounts,
            isMember: pricing.isMember,
            potentialMemberSavings: pricing.potentialMemberSavings,
            notMemberText: settings.notMemberText || "",
        });
    } catch (err) {
        console.error("quote order error:", err.message);
        res.status(500).json({ msg: "שגיאה בחישוב המחיר" });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const userId = req.tokenData._id;
        const { items, couponCode, fulfillmentMethod, customer, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ msg: "העגלה ריקה" });
        }
        // While the shop is closed to the public only the admin can place an order (e.g. to test it)
        if (req.tokenData.role !== "admin" && (await loadShopSettings()).siteClosed) {
            return res.status(403).json({ msg: "החנות עדיין לא פתוחה להזמנות. נשמח לראות אותך כשנפתח!", code: "SITE_CLOSED" });
        }

        const method = fulfillmentMethod === "delivery" ? "delivery" : "pickup";
        const customerDetails = sanitizeCustomerDetails(customer);
        const shippingDetails = method === "delivery" ? sanitizeShippingAddress(shippingAddress) : {};
        const checkoutErrors = validateCheckoutDetails({
            fulfillmentMethod: method,
            customer: customerDetails,
            shipping: shippingDetails,
        });
        const checkoutErrorMessage = firstCheckoutValidationMessage(checkoutErrors);
        if (checkoutErrorMessage) {
            return res.status(400).json({ msg: checkoutErrorMessage });
        }

        const pricing = await priceOrder({ items, couponCode, userId });
        if (pricing.error) {
            return res.status(400).json({ msg: pricing.error });
        }
        const { verifiedItems, subtotal, discount, discounts, clubGiftMemberId } = pricing;
        const shipping_fee = method === "delivery" ? DELIVERY_FEE : 0;
        const total_price = Math.max(0, subtotal - discount + shipping_fee);

        // Create the new order with the processing status
        const newOrder = new OrderModel({
            user_id: userId,
            items: verifiedItems,
            subtotal,
            discount,
            discounts: discounts.length ? discounts : undefined,
            clubGiftMemberId,
            coupon_code: couponCode || undefined,
            shipping_fee,
            fulfillment_method: method,
            customer: customerDetails,
            shipping_address: method === "delivery" ? shippingDetails : undefined,
            total_price,
            // When payment is connected, the order moves to processing only after the payment is verified
            ...(isHypConfigured()
                ? { status: AWAITING_PAYMENT, payment: { provider: "hyp", status: "pending" } }
                : { status: "processing" }),
        });

        const saved = await newOrder.save();

        await uploadPhotoPrintsToDrive(saved);
        // Organize the design files in a Drive folder per order (does not block on failure)
        await attachDriveFolderToOrder(saved);

        if (saved.items.some(isPhotoPrintItem) && !isDriveConfigured()) {
            console.warn("Drive: photo prints were not uploaded because Google Drive is not configured");
        }

        if (saved.status === AWAITING_PAYMENT) {
            // The coupon, email and cart are handled only after payment (confirmPayment)
            try {
                const paymentUrl = await createPaymentUrl(saved);
                return res.status(201).json({ ...saved.toObject(), paymentUrl });
            } catch (paymentErr) {
                console.error(`[Payment][order=${saved._id}] could not create payment page:`, paymentErr.message);
                return res.status(502).json({ msg: "לא הצלחנו לפתוח את דף התשלום. נסי שוב בעוד רגע." });
            }
        }

        await completeOrder(saved, userId);
        res.status(201).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה ביצירת ההזמנה" });
    }
};

// Fetch a specific order's details by its id
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await OrderModel.findById(id).populate("user_id", "name email createdAt");

        if (!order) {
            return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        }

        // Check that only the order owner or an admin can view it
        if (
            !isSameUser(req.tokenData._id, order.user_id?._id ?? order.user_id) &&
            req.tokenData.role !== "admin"
        ) {
            return res.status(403).json({ msg: "אין הרשאה לצפות בהזמנה זו" });
        }

        if (req.tokenData.role === "admin") {
            // Lets the admin page hide the Drive button instead of offering an action that cannot work yet
            return res.json({ ...order.toObject(), driveConfigured: isDriveConfigured() });
        }
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "שגיאה בטעינת ההזמנה" });
    }
};
