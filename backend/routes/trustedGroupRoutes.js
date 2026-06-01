const express = require('express');
const router = express.Router();
const trustedGroupController = require('../controllers/trustedGroupController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/', trustedGroupController.list);
router.post('/', trustedGroupController.create);
router.put('/:id', trustedGroupController.update);
router.delete('/:id', trustedGroupController.remove);

module.exports = router;
