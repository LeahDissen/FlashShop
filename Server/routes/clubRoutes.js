const express = require("express");
const router = express.Router();
const clubController = require("../controllers/clubController");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const {authAdmin} = require('../middlewares/auth');

router.get("/members", authAdmin, clubController.getClubMembers);
router.post("/members", authAdmin, clubController.addClubMember);
router.delete("/members/:id", authAdmin, clubController.deleteClubMember);
router.get("/unsubscribe/:id/:token", clubController.unsubscribe);
router.post("/broadcast", upload.single("image"), authAdmin, clubController.sendBroadcastEmail);
router.post("/join", clubController.joinClub);
router.get("/check/:code", clubController.checkGiftCode);
router.get("/confirm/:token", clubController.confirmGiftEmail);

module.exports = router;