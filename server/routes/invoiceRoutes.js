const express = require('express');
const { create, getAll, getById, updateStatus, payEerc, remove } = require('../controllers/invoiceController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.route('/').get(getAll).post(create);
router.route('/:id').get(getById).delete(remove);
router.patch('/:id/status', updateStatus);
router.patch('/:id/pay-eerc', payEerc);

module.exports = router;