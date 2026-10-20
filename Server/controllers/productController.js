const { ProductModel } = require("../models/productModel");
const { generateGiftIdea } = require("../utils/aiService");
const { isMagnetProductDoc, parseMagnetSize } = require("../utils/magnetSize");

function normalizeMaxQuantity(value) {
    if (value == null || value === "") return null;
    if (value === Infinity || value === "Infinity") return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}

function sanitizeProductBody(body = {}) {
    const data = { ...body };

    if (Array.isArray(data.priceTiers)) {
        data.priceTiers = data.priceTiers
            .filter((t) => t && t.minQuantity != null && t.unitPrice != null)
            .map((t) => {
                const row = {
                    minQuantity: Number(t.minQuantity),
                    unitPrice: Number(t.unitPrice),
                };
                const max = normalizeMaxQuantity(t.maxQuantity);
                if (max != null) {
                    row.maxQuantity = max;
                }
                return row;
            })
            .filter((t) => Number.isFinite(t.minQuantity) && Number.isFinite(t.unitPrice));
    }

    if (typeof data.size === "string") {
        data.size = data.size.trim();
    }

    if (data.isOnSale !== undefined) {
        data.isOnSale = data.isOnSale === true || data.isOnSale === "true";
    }

    // Shape: a built-in one, or the admin's own PNG (https) for "custom"
    if (data.shape !== undefined) {
        const type = data.shape?.type;
        let maskUrl = "";
        try {
            const url = new URL(String(data.shape?.maskUrl || ""));
            if (url.protocol === "https:") maskUrl = url.href;
        } catch { /* not a URL */ }
        if (["circle", "heart", "star", "flower"].includes(type)) data.shape = { type };
        else if (type === "custom" && maskUrl) data.shape = { type, maskUrl };
        else data.shape = null;
    }

    // Club members' discount: percent off or a final price; "on sale" follows it (members-only sales)
    if (data.memberDiscount !== undefined) {
        const type = data.memberDiscount?.type;
        const value = Number(data.memberDiscount?.value);
        const valid = (type === "percent" && value > 0 && value <= 100) || (type === "price" && value >= 0);
        data.memberDiscount = valid ? { type, value } : null;
        data.isOnSale = Boolean(data.memberDiscount);
        data.originalPrice = null;
    }

    if (data.originalPrice !== undefined) {
        const originalPrice = Number(data.originalPrice);
        data.originalPrice = data.originalPrice === "" || data.originalPrice === null || !Number.isFinite(originalPrice)
            ? null
            : originalPrice;
    }

    if (isMagnetProductDoc(data)) {
        data.priceTiers = [];
        const parsedSize = parseMagnetSize(data.size);
        if (parsedSize) {
            data.size = parsedSize.label;
            if (data.printWidth == null) data.printWidth = parsedSize.width;
            if (data.printHeight == null) data.printHeight = parsedSize.height;
        }
    }

    if (Array.isArray(data.captionIdeas)) {
        data.captionIdeas = data.captionIdeas
            .map((c) => ({
                text: String(c?.text ?? "").trim(),
                category: String(c?.category ?? "כללי").trim() || "כללי",
            }))
            .filter((c) => c.text.length > 0);
    }

    Object.keys(data).forEach((key) => {
        if (data[key] === undefined) {
            delete data[key];
        }
    });

    return data;
}

function handleProductError(err, res) {
    console.error(err);
    if (err?.name === "ValidationError") {
        const firstField = Object.values(err.errors || {})[0];
        const message = firstField?.message || err.message;
        return res.status(400).json({ msg: message });
    }
    if (err?.name === "CastError") {
        return res.status(400).json({ msg: "נתוני המוצר אינם תקינים" });
    }
    return res.status(500).json({ msg: "שגיאה בשמירת המוצר" });
}

exports.getProducts = async (req, res) => {
  try {
    let products = await ProductModel.find({});
    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.getProductById = async (req, res) => {
  try {
    let product = await ProductModel.findOne({ _id: req.params.id });
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const data = sanitizeProductBody(req.body);
    const product = new ProductModel(data);
    await product.save();
    res.json(product);
  } catch (err) {
    handleProductError(err, res);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = sanitizeProductBody(req.body);
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!updatedProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (err) {
    handleProductError(err, res);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    let id = req.params.id;
    let product = await ProductModel.deleteOne({ _id: id });
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.getProductImage = async (req, res) => {
  try {
    const product = await ProductModel.findById(req.params.id);
    if (!product) return res.status(404).json({ msg: "Product not found" });
    res.json({ imageUrl: product.image }); 
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error fetching image", err });
  }
};

const AI_MOCKUP_UNAVAILABLE_MESSAGE = "יצירת הדמיה של המוצר עדיין לא פעילה. היא תהיה זמינה בקרוב.";

/**
 * The AI product mockup is turned off for now: the route needs no login and every call is a paid
 * Gemini request, so anyone could run up the bill. No page on the site uses it yet.
 * To turn it back on, put it behind auth and a rate limit, then call generatePersonalizedProduct again.
 */
exports.generateMockup = (req, res) => {
    res.status(503).json({ msg: AI_MOCKUP_UNAVAILABLE_MESSAGE });
};

exports.generateGiftIdeaController = async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await generateGiftIdea(prompt);
        res.json({ result });
    } catch (error) {
        console.error("❌ Controller Gift Error:", error);
        res.status(500).json({ error: error.message });
    }
};