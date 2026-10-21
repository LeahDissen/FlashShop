const express = require("express");
const router = express.Router();
const shopSettingsController = require("../controllers/shopSettingsController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", shopSettingsController.getShopSettings);
router.put("/", authAdmin, shopSettingsController.updateShopSettings);
router.get("/email", authAdmin, shopSettingsController.getEmailSettings);
router.put("/email", authAdmin, shopSettingsController.updateEmailSettings);

module.exports = router;
