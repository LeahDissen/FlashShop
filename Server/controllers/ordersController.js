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
// Update items in an existing order by user ID with status 'pending'

exports.updateOrder = async (req, res) => {
    try {
        const userId = req.params.userId;
        const newItems = req.body.items;
        const newTotalPrice = req.body.total_price;
        let order = await OrderModel.findOneAndUpdate(
            { user_id: userId, status: "pending" },
            { items: newItems, total_price: newTotalPrice },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
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

// Create a new order
// ... existing imports

exports.createOrder = async (req, res) => {
    try {
        const { user_id, items, total_price, status } = req.body;
        
        // Map the incoming cart items to the new schema format
        const formattedItems = items.map(item => ({
            productId: item.productId || null, // null for custom photos
            name: item.name,
            size: item.size || null,           // Save the size
            quantity: item.quantity,
            price: item.price,
            image: item.image                  // Save the Cloudinary URL
        }));

        const newOrder = new OrderModel({
            user_id,
            items: formattedItems,
            total_price: total_price || 0,
            status: status || "pending",
        });

        const saved = await newOrder.save();
        res.status(201).json(saved);
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: "There was an error, try again later", err });
    }
};

// Get single order by ID
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