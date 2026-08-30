const express = require("express");
const router = express.Router();
const designFramesController = require("../controllers/designFramesController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", designFramesController.getAllDesignFrames);
router.post("/calculate-aspect-ratio", designFramesController.calculateAspectRatio);
router.post("/", authAdmin, designFramesController.addDesignFrame);
router.put("/:id", authAdmin, designFramesController.updateDesignFrame);
router.delete("/:id", authAdmin, designFramesController.deleteDesignFrame);

module.exports = router;
