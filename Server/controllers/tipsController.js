const { TipsModel } = require("../models/tipsModel");

exports.getAllTips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;
    const totalCount = await TipsModel.countDocuments();
    let query = TipsModel.find({})
      .sort({ createdAt: 'desc' })
      .skip(skip)
      .limit(limit);
    const tips = await query.exec();
    res.json({
      tips: tips,
      totalCount: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (err) {
    console.error("Error fetching tips with pagination:", err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.addTip = async (req, res) => {
  try {
    const data = req.body;
    console.log('Received tip data:', data);
    const tip = new TipsModel(data);
    await tip.save();
    console.log('tip saved:', tip);
    res.json(tip);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.updateTip = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const updateData = { ...data };
    const updatedTip = await TipsModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    if (!updatedTip) {
      return res.status(404).json({ msg: "Tip not found" });
    }
    res.json(updatedTip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};