const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const { getSuppliers, createSupplier, deleteSupplier } = require('../controllers/supplierController');

router.get('/',       protect, getSuppliers);
router.post('/',      protect, createSupplier);
router.delete('/:id', protect, deleteSupplier);

module.exports = router;
