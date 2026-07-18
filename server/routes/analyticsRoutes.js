const express = require('express');
const {
  getAdvancedAnalytics,
  getTopCustomers,
  getPaymentPatterns,
  getTopProducts,
} = require('../controllers/analyticsController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/advanced',          getAdvancedAnalytics);
router.get('/top-customers',     getTopCustomers);
router.get('/payment-patterns',  getPaymentPatterns);
router.get('/products',          getTopProducts);

module.exports = router;
