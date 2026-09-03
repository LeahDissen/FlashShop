const express = require("express");
const router = express.Router();
const editorSettingsController = require("../controllers/editorSettingsController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", editorSettingsController.getEditorSettings);
router.put("/", authAdmin, editorSettingsController.updateEditorSettings);

module.exports = router;
