const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
// --- Multer setup ---


router.get("/", productController.getProducts);

router.get("/:id", productController.getProductById);

router.get("/:id/image", productController.getProductImage);

router.post("/", productController.addProduct);

router.put("/:id", productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

router.post("/generate-mockup", productController.generateMockup);

module.exports = router;
