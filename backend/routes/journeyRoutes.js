const express = require('express');
const router = express.Router();
const journeyController = require('../controllers/journeyController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/', journeyController.list);
router.get('/active', journeyController.getActive);
router.post('/start', journeyController.start);
router.post('/:id/complete', journeyController.complete);
router.post('/:id/cancel', journeyController.cancel);

module.exports = router;
