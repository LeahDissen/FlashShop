const express = require('express');
const router = express.Router();
const contactController= require('../controllers/contactController');
const ApiRateLimiter = require('../middlewares/apiRate');

router.post('/', contactController.receiveContact);
router.get('/', ApiRateLimiter, contactController.getContacts);
router.put('/:id', ApiRateLimiter, contactController.updateContactStatus);
router.delete('/:id', ApiRateLimiter, contactController.deleteContact);

module.exports = router;