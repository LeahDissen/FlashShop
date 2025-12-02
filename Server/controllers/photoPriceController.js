const { PhotoPriceModel } = require("../models/photoPriceModel");

// Get all sizes and prices
exports.getPrices = async (req, res) => {
    try {
        const prices = await PhotoPriceModel.find({});
        res.json(prices);
    } catch (err) {
        res.status(500).json({ err });
    }
};

// Update a price (For Admin)
exports.updatePrice = async (req, res) => {
    try {
        const { size, price } = req.body;
        const updated = await PhotoPriceModel.findOneAndUpdate(
            { size }, 
            { price }, 
            { new: true, upsert: true } // Create if doesn't exist
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ err });
    }
};

