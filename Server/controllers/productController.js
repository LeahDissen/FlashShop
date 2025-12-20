const { ProductModel } = require("../models/productModel");
const { generatePersonalizedProduct, generateGiftIdea } = require("../utils/aiService");

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
    const data = req.body;
    const product = new ProductModel(data);
    await product.save();
    res.json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    if (!updatedProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.json(updatedProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
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