const { PhotoPriceModel } = require("../models/photoPriceModel");

exports.getPrices = async (req, res) => {
    try {
        const prices = await PhotoPriceModel.find({});
        res.json(prices);
    } catch (err) {
        res.status(500).json({ err });
    }
};

exports.updatePrice = async (req, res) => {
    try {
        const { size, price } = req.body;
        const updated = await PhotoPriceModel.findOneAndUpdate(
            { size }, 
            { price }, 
            { new: true, upsert: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ err });
    }
};

