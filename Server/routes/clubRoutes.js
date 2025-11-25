const express = require("express");
const router = express.Router();
const clubController = require("../controllers/clubController");

router.post("/join", clubController.joinClub);
router.get("/check/:code", clubController.checkGiftCode);
router.put("/redeem", clubController.redeemGift);

module.exports = router;