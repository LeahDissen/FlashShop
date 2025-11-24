const express = require("express");
const router = express.Router();
const multer = require("multer");
const tipsController = require("../controllers/tipsController.js");

router.get("/", tipsController.getAllTips);
router.post("/", tipsController.addTip);
router.put("/:id", tipsController.updateTip);

module.exports = router;