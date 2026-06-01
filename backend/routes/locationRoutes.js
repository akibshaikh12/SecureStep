const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/', locationController.getLatest);
router.get('/tracking', locationController.getTrackingStatus);
router.post('/tracking', locationController.setTracking);
router.post('/update', locationController.update);

module.exports = router;
