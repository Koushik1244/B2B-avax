const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { handlePayment } = require('../controllers/paymentController');

router.post('/webhook', protect, handlePayment);

module.exports = router;
