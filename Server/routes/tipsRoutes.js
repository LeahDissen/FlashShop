const express = require("express");
const router = express.Router();
const multer = require("multer");
const tipsController = require("../controllers/tipsController.js");
const { authAdmin } = require("../middlewares/auth.js");

router.get("/", tipsController.getAllTips);
router.post("/", authAdmin,tipsController.addTip);
router.post("/import", authAdmin, tipsController.importTips);
router.put("/:id",authAdmin, tipsController.updateTip);

module.exports = router;