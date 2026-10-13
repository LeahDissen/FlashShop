const express = require("express");
const router = express.Router();
const popupsController = require("../controllers/popupsController");
const { authAdmin } = require("../middlewares/auth");

router.get("/active", popupsController.getActivePopups);
router.get("/", authAdmin, popupsController.getAllPopups);
router.post("/", authAdmin, popupsController.addPopup);
router.put("/:id", authAdmin, popupsController.updatePopup);
router.delete("/:id", authAdmin, popupsController.deletePopup);

module.exports = router;
