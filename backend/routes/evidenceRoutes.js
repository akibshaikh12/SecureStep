const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/', evidenceController.list);
router.get('/:id', evidenceController.getOne);
router.post('/', evidenceController.create);
router.delete('/:id', evidenceController.remove);

module.exports = router;
