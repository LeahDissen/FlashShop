const express = require("express");
const router = express.Router();
const frameCategoriesController = require("../controllers/frameCategoriesController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", frameCategoriesController.getAllFrameCategories);
router.post("/", authAdmin, frameCategoriesController.addFrameCategory);
router.put("/:id", authAdmin, frameCategoriesController.updateFrameCategory);
router.delete("/:id", authAdmin, frameCategoriesController.deleteFrameCategory);

module.exports = router;
