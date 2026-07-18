const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const protect  = require('../middleware/authMiddleware');
const { scanBill } = require('../controllers/ocrController');

// Store file in memory — pass buffer directly to Tesseract
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are accepted'));
  },
});

router.post('/scan', protect, upload.single('image'), scanBill);

module.exports = router;
