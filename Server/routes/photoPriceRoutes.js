const express = require("express");
const router = express.Router();
const controller = require("../controllers/photoPriceController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", controller.getPrices);
router.post("/update", authAdmin,controller.updatePrice);

module.exports = router;