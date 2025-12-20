const router = require("express").Router();
const { login, signup, logout, requestPasswordReset, resetPassword, myInfo, googleLogin } = require('../controllers/userController.js');
const { auth } = require("../middlewares/auth");

router.post('/login', login);
router.post('/signup', signup);
router.get('/myInfo', auth, myInfo);
router.post('/requestPasswordReset', requestPasswordReset);
router.post('/logout', logout);
router.post('/resetPassword', resetPassword);
router.post('/google', googleLogin);

module.exports = router;