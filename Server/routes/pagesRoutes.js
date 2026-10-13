const express = require("express");
const router = express.Router();
const pagesController = require("../controllers/pagesController");
const { authAdmin } = require("../middlewares/auth");

router.get("/:key", pagesController.getPage);
router.put("/:key", authAdmin, pagesController.updatePage);

module.exports = router;
