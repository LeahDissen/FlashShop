const { OrderModel } = require("../models/ordersModel");

exports.getPendingOrderForUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        let orders = await OrderModel.find({ user_id: userId, status: "pending" });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
    }
};

exports.getOrders = async (req, res) => {
    try {
        let orders = await OrderModel.find({});
        res.json(orders);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
    }
};

exports.getOrdersByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        let orders = await OrderModel.find({ user_id: userId, status: { $ne: "pending" } });
        res.json(orders);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const userId = req.params.userId;
        const newItems = req.body.items;
        const newTotalPrice = req.body.total_price;

        let order = await OrderModel.findOneAndUpdate(
            { user_id: userId, status: "pending" },
            { 
                $set: { 
                    items: newItems, 
                    total_price: newTotalPrice,
                    date_created: Date.now()
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "Error updating cart", err });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const newStatus = req.body.status;
        let order = await OrderModel.findOneAndUpdate(
            { _id: id },
            { status: newStatus },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { user_id, items, total_price, status, couponCode } = req.body;

        if (couponCode && user_id) {
            const coupon = await CouponModel.findOne({ code: couponCode });
            if (coupon) {
                if (!coupon.usedBy.includes(user_id)) {
                    coupon.usedBy.push(user_id);
                    await coupon.save();
                }
            } 
            else {
                await ClubModel.findOneAndUpdate(
                    { giftCode: couponCode },
                    { isUsed: true }
                );
            }
        }

        const newOrder = new OrderModel({
            user_id,
            items: items || [],
            total_price: total_price || 0,
            status: status || "pending",
        });
        const saved = await newOrder.save();
        res.status(201).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error", err });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const id = req.params.id;
        const order = await OrderModel.findById(id);
        if (!order) return res.status(404).json({ msg: "Order not found" });
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
    }
};