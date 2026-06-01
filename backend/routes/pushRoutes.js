const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/status', pushController.getStatus);
router.post('/register', pushController.register);
router.post('/unregister', pushController.unregister);

module.exports = router;
