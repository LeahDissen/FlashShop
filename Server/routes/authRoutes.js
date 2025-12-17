const router = require("express").Router();
const { auth } = require("../middlewares/auth");

const { login, signup, logout, requestPasswordReset, resetPassword, myInfo,googleLogin } = require('../controllers/userController.js');

router.post('/login', login);
router.post('/signup', signup);
router.get('/myInfo', auth, myInfo);
// Route to request password reset
router.post('/requestPasswordReset', requestPasswordReset);
router.post('/logout', logout);

// Route to reset password
router.post('/resetPassword', resetPassword);
router.post('/google', googleLogin);

module.exports = router;