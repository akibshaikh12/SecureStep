const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/messages', chatController.getMessages);
router.post('/messages', chatController.sendMessage);
router.delete('/session', chatController.clearSession);

module.exports = router;
