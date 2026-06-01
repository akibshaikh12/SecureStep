const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/', incidentController.list);
router.get('/incoming', incidentController.listIncoming);
router.get('/incoming/:id', incidentController.getIncoming);
router.get('/active', incidentController.getActive);
router.post('/', incidentController.create);
router.post('/:id/sos-photo', incidentController.uploadSosPhoto);
router.post('/:id/dispatch-push', incidentController.dispatchPush);
router.patch('/:id/resolve', incidentController.resolve);

module.exports = router;
