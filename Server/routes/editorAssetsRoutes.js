const express = require("express");
const router = express.Router();
const editorAssetsController = require("../controllers/editorAssetsController");
const { authAdmin } = require("../middlewares/auth");

router.get("/", editorAssetsController.getAllEditorAssets);
router.post("/", authAdmin, editorAssetsController.addEditorAsset);
router.put("/:id", authAdmin, editorAssetsController.updateEditorAsset);
router.delete("/:id", authAdmin, editorAssetsController.deleteEditorAsset);

module.exports = router;
