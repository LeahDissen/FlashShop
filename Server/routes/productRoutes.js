const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { authAdmin } = require("../middlewares/auth");
// --- Multer setup ---


router.get("/", productController.getProducts);

router.get("/:id", productController.getProductById);

router.get("/:id/image", productController.getProductImage);

router.post("/", authAdmin,productController.addProduct);

router.put("/:id", authAdmin,productController.updateProduct);

router.delete("/:id", authAdmin,productController.deleteProduct);

router.post("/generate-mockup", productController.generateMockup);

module.exports = router;
