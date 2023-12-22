const router = require("express").Router();
const authController = require('../controllers/auth');
const isAuth = require('../middleware/auth');

router.post('/login', (req, res, next) => authController.login(req, res, next));

router.post('/google-login', (req, res, next) => authController.googleLogin(req, res, next));

router.post('/google-bearer-token', (req, res, next) => authController.googleBearerToken(req, res, next));

router.post('/register', (req, res, next) => authController.register(req, res, next));

router.post('/registerWithGoogle', (req, res, next) => authController.registerWithGoogle(req, res, next));

router.post('/loginWithGoogle', (req, res, next) => authController.loginWithGoogle(req, res, next));

router.post('/verify-email', isAuth, (req, res, next) => authController.verifyEmail(req, res, next));

router.post('/resend-verification-email', (req, res, next) => authController.resendVerificationEmail(req, res, next));

router.post('/forgot-password', (req, res, next) => authController.forgotPassword(req, res, next));

router.post('/reset-password', isAuth, (req, res, next) => authController.resetPassword(req, res, next));

router.post('/change-password', isAuth,  (req, res, next) => authController.changePassword(req, res, next));

module.exports = router;