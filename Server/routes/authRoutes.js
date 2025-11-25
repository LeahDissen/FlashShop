const router = require("express").Router();

const { login, signup, logout, requestPasswordReset, resetPassword } = require('../controllers/userController.js');

router.post('/login', login);
router.post('/signup', signup);
// Route to request password reset
router.post('/requestPasswordReset', requestPasswordReset);
router.post('/logout', logout);

// Route to reset password
router.post('/resetPassword', resetPassword);

module.exports = router;