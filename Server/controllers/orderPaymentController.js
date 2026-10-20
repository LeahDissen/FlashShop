/** Card payment with Hyp Pay: confirming the customer's return and the admin's connection check */
const { OrderModel } = require("../models/ordersModel");
const { isHypConfigured, verifyPaymentRedirect, checkConnection } = require("../services/hypPaymentService");
const { completeOrder } = require("../services/orderCompletionService");
const { ensureSelfOrAdmin } = require("../utils/ownership");

/** Parameters the server adds itself to the verification request – they must not come from the browser */
const RESERVED_PAYMENT_PARAMS = new Set(["action", "what", "key", "passp", "masof"]);

/**
 * The customer came back from the payment page to the success page. Verify with Hyp that the return is genuine and that the amount and order match,
 * then the order moves to processing. Safe to call again (page refresh) – a paid order is never processed twice.
 */
exports.confirmPayment = async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "הזמנה לא נמצאה" });
        if (!ensureSelfOrAdmin(req, res, order.user_id)) return;
        if (order.payment?.status === "paid") return res.json(order);

        const query = String(req.body?.query || "").replace(/^\?/, "");
        const params = new URLSearchParams(query);
        const keys = [...params.keys()];
        // A duplicate parameter or terminal details inside the return = an attempt to make Hyp verify different values than the ones checked here
        const tampered = new Set(keys).size !== keys.length
            || keys.some((key) => RESERVED_PAYMENT_PARAMS.has(key.toLowerCase()));
        if (tampered) {
            console.warn(`[Payment][order=${order._id}] rejected redirect with duplicate or reserved params`);
            return res.status(400).json({ msg: "התשלום לא הושלם" });
        }
        const amountMatches = Math.abs(Number(params.get("Amount")) - Number(order.total_price)) <= 0.01;
        if (params.get("Order") !== String(order._id) || params.get("CCode") !== "0" || !amountMatches) {
            return res.status(400).json({ msg: "התשלום לא הושלם" });
        }
        if (!(await verifyPaymentRedirect(query))) {
            // Hyp reported an approved charge but the signature check failed. The customer was most likely
            // charged, so the order is flagged for the admin to check in the Hyp portal instead of reported as failed.
            console.warn(`[Payment][order=${order._id}] Hyp verification failed, flagged for review`);
            await OrderModel.updateOne(
                { _id: order._id, "payment.status": { $ne: "paid" } },
                {
                    $set: {
                        "payment.status": "review",
                        "payment.transactionId": params.get("Id"),
                        "payment.approvalCode": params.get("ACode"),
                        "payment.returnQuery": query.slice(0, 2000),
                    },
                },
            );
            return res.status(202).json({
                review: true,
                msg: "התשלום התקבל ונמצא בבדיקה. נאשר את ההזמנה בהקדם וניצור קשר אם יידרש.",
            });
        }

        // Atomic update: only one request moves the order to "paid"
        const paid = await OrderModel.findOneAndUpdate(
            { _id: order._id, "payment.status": { $ne: "paid" } },
            {
                $set: {
                    status: "processing",
                    "payment.status": "paid",
                    "payment.transactionId": params.get("Id"),
                    "payment.approvalCode": params.get("ACode"),
                    "payment.paidAt": new Date(),
                },
            },
            { new: true },
        );
        if (!paid) return res.json(await OrderModel.findById(order._id));

        await completeOrder(paid, paid.user_id);
        res.json(paid);
    } catch (err) {
        console.error(`[Payment][order=${req.params.id}] confirm error:`, err.message);
        res.status(500).json({ msg: "שגיאה באימות התשלום" });
    }
};

/** Admin check: are the Hyp credentials in Railway correct (without charging) */
exports.checkPaymentConnection = async (req, res) => {
    if (!isHypConfigured()) {
        return res.json({ configured: false, ok: false, msg: "חסרים HYP_MASOF / HYP_KEY / HYP_PASSP" });
    }
    try {
        const { ok, code, reason } = await checkConnection();
        const msg = ok ? "החיבור ל-Hyp תקין"
            : reason === "page" ? "דף התשלום של Hyp דוחה את החתימה – כנראה HYP_KEY שגוי או חלקי"
            : `Hyp דחו את הבקשה (קוד ${code})`;
        res.json({ configured: true, ok, code, msg });
    } catch (err) {
        res.status(502).json({ configured: true, ok: false, msg: `אין תשובה מ-Hyp: ${err.message}` });
    }
};
