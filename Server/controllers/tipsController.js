const { TipsModel } = require("../models/tipsModel");

exports.getAllTips = async (req, res) => {
  try {
    let tips = await TipsModel.find({});
    res.json(tips);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.addTip = async (req, res) => {
  try {
    const data = req.body;
    console.log('Received tip data:', data);
    // handle uploaded image if present
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

    // Prepare update object
    const updateData = { ...data };

    // Use findByIdAndUpdate for a clean partial update
    const updatedTip = await TipsModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // return the updated document
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