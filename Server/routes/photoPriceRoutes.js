const express = require("express");
const router = express.Router();
const controller = require("../controllers/photoPriceController");

router.get("/", controller.getPrices);
router.post("/update", controller.updatePrice);

module.exports = router;