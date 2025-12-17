const express = require("express");
const router = express.Router();
const clubController = require("../controllers/clubController");
const multer = require("multer");
const upload = multer();
const {authAdmin} = require('../middlewares/auth');

router.post("/broadcast", upload.single("image"), authAdmin,clubController.sendBroadcastEmail);
router.post("/join", clubController.joinClub);
router.get("/check/:code", clubController.checkGiftCode);
router.put("/redeem", clubController.redeemGift);

module.exports = router;