const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacyController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/settings', privacyController.getSettings);
router.patch('/settings', privacyController.updateSettings);
router.get('/data-summary', privacyController.getDataSummary);
router.post('/delete', privacyController.deleteData);

module.exports = router;
