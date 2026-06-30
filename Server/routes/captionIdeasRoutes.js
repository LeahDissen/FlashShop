const express = require("express");
const router = express.Router();
const captionIdeasController = require("../controllers/captionIdeasController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", captionIdeasController.getAllCaptionIdeas);
router.post("/", authAdmin, captionIdeasController.addCaptionIdea);
router.delete("/:id", authAdmin, captionIdeasController.deleteCaptionIdea);

module.exports = router;
