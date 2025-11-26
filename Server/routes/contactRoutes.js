const express = require('express');
const router = express.Router();
const { receiveContact } = require('../controllers/contactController');
const ApiRateLimiter = require('../middlewares/apiRate');

router.post('/', receiveContact);
router.get('/', ApiRateLimiter, getContacts);
router.put('/:id', ApiRateLimiter, updateContactStatus);
router.delete('/:id', ApiRateLimiter, deleteContact);

module.exports = router;