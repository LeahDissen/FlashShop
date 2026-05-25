const router = require("express").Router();
const { login, signup, logout, requestPasswordReset, resetPassword, myInfo, googleLogin } = require('../controllers/userController.js');
const { auth } = require("../middlewares/auth");
const apiRateLimiter = require("../middlewares/apiRate");

router.post('/signup', signup);
router.post('/login', apiRateLimiter, login);
router.get('/myInfo', auth, myInfo);
router.post('/requestPasswordReset', apiRateLimiter, requestPasswordReset);
router.post('/logout', logout);
router.post('/resetPassword', resetPassword);
router.post('/google', googleLogin);

module.exports = router;