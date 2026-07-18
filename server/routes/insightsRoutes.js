const express = require('express');
const { getInsights } = require('../controllers/insightsController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getInsights);

module.exports = router;
