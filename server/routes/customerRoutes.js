const express = require('express');
const { create, getAll, getById, remove } = require('../controllers/customerController');
const protect = require('../middleware/authMiddleware');
const Invoice = require('../models/Invoice');

const router = express.Router();

router.use(protect);

router.route('/').get(getAll).post(create);
router.route('/:id').get(getById).delete(remove);

// GET /api/customers/:id/health
// Returns a 0-100 health score based on payment behaviour
router.get('/:id/health', async (req, res) => {
  try {
    const invoices = await Invoice.find({
      userId: req.user._id,
      customerId: req.params.id,
    });

    if (invoices.length === 0) {
      return res.json({ score: 100, label: 'New Customer', color: 'green', breakdown: {} });
    }

    const total      = invoices.length;
    const paid       = invoices.filter(i => i.status === 'paid').length;
    const overdue    = invoices.filter(i => i.status === 'overdue').length;
    const ignored    = invoices.reduce((s, i) => s + (i.ignoredCount || 0), 0);

    // Payment rate: 0-40 pts
    const paymentRate   = paid / total;
    const paymentScore  = Math.round(paymentRate * 40);

    // Overdue penalty: -10 per overdue invoice, min 0
    const overdueScore  = Math.max(0, 40 - overdue * 10);

    // Ignore penalty: -5 per ignored reminder, min 0
    const ignoreScore   = Math.max(0, 20 - ignored * 5);

    const score = paymentScore + overdueScore + ignoreScore;

    const label = score >= 80 ? 'Excellent' : score >= 50 ? 'Fair' : 'At Risk';
    const color = score >= 80 ? 'green'     : score >= 50 ? 'yellow' : 'red';

    res.json({
      score,
      label,
      color,
      breakdown: { paymentRate: Math.round(paymentRate * 100), overdue, ignoredReminders: ignored, total },
    });
  } catch (err) {
    res.status(500).json({ message: 'Health score error', error: err.message });
  }
});

module.exports = router;
