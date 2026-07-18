const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const { createRawMaterial, getRawMaterials } = require('../controllers/rawMaterialController');
const { supplierStats, materialAnalytics, totalGST, monthlySpend } = require('../controllers/rawMaterialAnalytics');

// Analytics routes (before /:id to avoid conflicts)
router.get('/analytics/suppliers', protect, supplierStats);
router.get('/analytics/materials', protect, materialAnalytics);
router.get('/analytics/gst',       protect, totalGST);
router.get('/analytics/monthly',   protect, monthlySpend);

// CRUD
router.get('/',  protect, getRawMaterials);
router.post('/', protect, createRawMaterial);

module.exports = router;
