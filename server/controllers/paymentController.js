const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');

// POST /api/payments/webhook
// Body: { invoiceId }
const handlePayment = async (req, res) => {
  const { invoiceId } = req.body;

  if (!invoiceId)
    return res.status(400).json({ message: 'invoiceId is required' });

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, userId: req.user._id })
      .populate('customerId', 'name businessName');

    if (!invoice)
      return res.status(404).json({ message: 'Invoice not found' });

    if (invoice.status === 'paid')
      return res.status(400).json({ message: 'Invoice is already paid' });

    invoice.status = 'paid';
    await invoice.save();

    const customerName = invoice.customerId?.name || invoice.customerId?.businessName || 'Customer';

    await Notification.create({
      userId: req.user._id,
      title: 'Payment Received',
      message: `Payment of ₹${invoice.total.toLocaleString('en-IN')} received from ${customerName} for invoice ${invoice.invoiceNumber}.`,
      type: 'payment_received',
      invoiceId: invoice._id,
      customerId: invoice.customerId._id,
      priority: 'medium',
    });

    res.json({
      ok: true,
      message: 'Invoice marked as paid',
      invoice: {
        _id: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        total: invoice.total,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { handlePayment };
