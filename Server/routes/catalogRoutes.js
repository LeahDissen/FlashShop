const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authAdmin } = require('../middlewares/auth');
const catalogController = require('../controllers/catalogController');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/upload-catalog', authAdmin, upload.single('catalog'), catalogController.uploadCatalog);
router.get('/download-catalog', catalogController.downloadCatalog);

module.exports = router;