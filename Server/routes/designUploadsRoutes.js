const express = require("express");
const router = express.Router();
const designUploadsController = require("../controllers/designUploadsController");
const { auth } = require("../middlewares/auth");

router.get("/status", designUploadsController.getDriveStatus);
router.post("/", auth, designUploadsController.uploadDesign);

module.exports = router;
