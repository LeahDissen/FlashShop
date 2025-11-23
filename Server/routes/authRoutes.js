const router = require("express").Router();

const  { login,signup,requestPasswordReset, resetPassword,googleLogin } =require( '../controllers/userController.js');

router.post('/login', login);
router.post('/signup', signup);
// Route to request password reset
router.post('/requestPasswordReset', requestPasswordReset);

// Route to reset password
router.post('/resetPassword', resetPassword);
router.post('/google', googleLogin);

module.exports = router;