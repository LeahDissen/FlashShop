const {ProductModel} = require("../models/productModel");

exports.getProducts = async (req, res) => {
  try {
    let products = await ProductModel.find({});
    res.json(products);
    } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};
//'/product/:id'
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
    console.log('Received product data:', data);
    // handle uploaded image if present
    let imageData = [];
    if (req.file) {
      imageData.push({
        data: req.file.buffer,
        contentType: req.file.mimetype,
      });
    }
    const dataWithImage = { ...data, image: imageData };
    const product = new ProductModel(dataWithImage);
    await product.save();

    console.log('Product saved:', product);
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

    // Prepare update object
    const updateData = { ...data };

    // If user uploaded a new image, replace the old one
    if (req.file) {
      updateData.image = [
        {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      ];
    }

    // Use findByIdAndUpdate for a clean partial update
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // return the updated document
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

    if (!product || !product.image || product.image.length === 0) {
      return res.status(404).json({ msg: "Image not found" });
    }

    const image = product.image[0];
    res.set("Content-Type", image.contentType);
    res.send(image.data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};
exports.generateGiftImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const imageBuffer = await generateGiftImage(prompt);

    res.set("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "There was an error, try again later", err });
  }
};