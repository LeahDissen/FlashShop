const { ProductModel } = require("../models/productModel");
const { generatePersonalizedProduct, generateGiftIdea } = require("../utils/aiService");

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

exports.generateMockup = async (req, res) => {
    console.log("Controller: Received request for generateMockup");
    try {
        const { productName, designImage } = req.body;
        if (!productName) console.log("Controller Warning: productName is missing");
        if (!designImage) console.log("Controller Warning: designImage is missing (length: 0)");
        else console.log(`Controller: designImage received (length: ${designImage.length})`);

        console.log("Controller: Calling aiService.generatePersonalizedProduct...");
        
        const result = await generatePersonalizedProduct(productName, designImage);
        
        console.log("Controller: Success! Sending result back to client.");
        res.json({ result });

    } catch (error) {
        console.error("❌ Controller Error Caught:", error); 
        res.status(500).json({ error: error.message });
    }
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