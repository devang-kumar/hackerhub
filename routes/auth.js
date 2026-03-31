const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { isLoggedIn } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/register', ctrl.getRegister);
router.post('/register', ctrl.postRegister);
router.get('/verify/:token', ctrl.verifyEmail);
router.get('/login', ctrl.getLogin);
router.post('/login', ctrl.postLogin);
router.get('/logout', ctrl.logout);
router.get('/profile', isLoggedIn, ctrl.getProfile);
router.post('/profile', isLoggedIn, upload.single('resume'), ctrl.updateProfile);
router.get('/forgot-password', ctrl.getForgotPassword);
router.post('/forgot-password', ctrl.postForgotPassword);
router.get('/reset-password/:token', ctrl.getResetPassword);
router.post('/reset-password/:token', ctrl.postResetPassword);

module.exports = router;
