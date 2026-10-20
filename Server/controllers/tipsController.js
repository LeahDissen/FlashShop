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

const MAX_IMPORTED_TIPS = 60;
const isHttpsUrl = (value) => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};
const cleanText = (value, max) => String(value || "").trim().slice(0, max);

/**
 * Saves the tips the admin approved from a Word document, in the document's order:
 * the first tip gets the newest date, so it shows first like on the tips page.
 */
exports.importTips = async (req, res) => {
  try {
    const tips = Array.isArray(req.body?.tips) ? req.body.tips.slice(0, MAX_IMPORTED_TIPS) : [];
    const docs = [];
    for (const tip of tips) {
      const title = cleanText(tip.title, 200);
      const content = cleanText(tip.content, 20000);
      const images = (Array.isArray(tip.images) ? tip.images : []).filter(isHttpsUrl).slice(0, 12);
      if (!title || !content || !images.length) {
        return res.status(400).json({ msg: `לכל טיפ צריך כותרת, טקסט ולפחות תמונה אחת ("${title || "ללא כותרת"}")` });
      }
      docs.push({
        title,
        content,
        summary: cleanText(tip.summary, 300) || content.replace(/\s+/g, " ").slice(0, 150),
        img: images[0],
        images: images.slice(1),
      });
    }
    if (!docs.length) {
      return res.status(400).json({ msg: "לא התקבלו טיפים לשמירה" });
    }
    const now = Date.now();
    const saved = await TipsModel.insertMany(
      docs.map((doc, index) => ({ ...doc, createdAt: new Date(now - index * 1000), updatedAt: new Date(now) })),
      { timestamps: false },
    );
    res.status(201).json({ count: saved.length, tips: saved });
  } catch (err) {
    console.error("import tips error:", err.message);
    res.status(500).json({ msg: "שגיאה בשמירת הטיפים" });
  }
};
