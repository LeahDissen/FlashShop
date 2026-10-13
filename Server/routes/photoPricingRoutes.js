const express = require("express");
const router = express.Router();
const controller = require("../controllers/photoPricingController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", controller.getPricing);
router.put("/", authAdmin, controller.updatePricing);

module.exports = router;
