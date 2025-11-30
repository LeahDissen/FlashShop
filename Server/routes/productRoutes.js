const express = require("express");
const router = express.Router();
const multer = require("multer");
const productController = require("../controllers/productController");
// --- Multer setup ---
const upload = multer(); // store file in memory as Buffer


router.get("/", productController.getProducts);

router.get("/:id", productController.getProductById);

router.get("/:id/image", productController.getProductImage);

router.post("/", upload.single("image"), productController.addProduct);

router.put("/:id", upload.single("image"), productController.updateProduct);

router.delete("/:id", productController.deleteProduct);

module.exports = router;
