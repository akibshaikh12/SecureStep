const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);
router.get('/', contactController.list);
router.post('/', contactController.create);
router.patch('/:id/priority', contactController.setPushPriority);
router.put('/:id', contactController.update);
router.delete('/:id', contactController.remove);

module.exports = router;
