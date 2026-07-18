const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  getInventory, createInventory, updateInventory, deleteInventory,
} = require('../controllers/inventoryController');

router.get('/',      protect, getInventory);
router.post('/',     protect, createInventory);
router.patch('/:id', protect, updateInventory);
router.delete('/:id',protect, deleteInventory);

module.exports = router;
