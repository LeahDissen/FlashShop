const express = require('express');
const router = express.Router();
const contactController= require('../controllers/contactController');
const ApiRateLimiter = require('../middlewares/apiRate');
const {authAdmin} = require('../middlewares/auth');
router.post('/', ApiRateLimiter,contactController.receiveContact);
router.get('/', authAdmin, contactController.getContacts);
router.put('/:id', ApiRateLimiter, authAdmin, contactController.updateContactStatus);
router.delete('/:id', ApiRateLimiter, authAdmin, contactController.deleteContact);

module.exports = router;