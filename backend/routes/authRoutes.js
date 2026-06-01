const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

router.post('/register/request-otp', authController.requestRegistrationOtp);
router.post('/register/verify-otp', authController.verifyRegistrationOtp);
router.post('/login', authController.login);
router.get('/me', authRequired, authController.me);

module.exports = router;
