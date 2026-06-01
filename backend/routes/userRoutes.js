const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/me', userController.getProfile);
router.patch('/me', userController.updateProfile);
router.get('/me/preferences', userController.getPreferences);
router.patch('/me/preferences', userController.updatePreferences);
router.post('/me/2fa/enable', userController.enable2FA);
router.post('/me/2fa/disable', userController.disable2FA);

module.exports = router;
