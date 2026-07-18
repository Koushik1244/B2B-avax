const Invoice = require('../models/Invoice');
const { evaluate } = require('../services/reminderService');
const { generateReminderMessage } = require('../services/geminiService');

const buildResult = async (invoice, language = 'Hinglish') => {
  const customer = invoice.customerId;
  const result = evaluate(invoice);

  let message = null;

  if (result.decision === 'SEND' || result.decision === 'ESCALATE') {
    const now = new Date();
    const daysOverdue = invoice.dueDate
      ? Math.max(0, Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)))
      : 0;

    try {
      message = await generateReminderMessage({
        customerName: customer?.name || 'Customer',
        businessName: customer?.businessName || '',
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.total,
        daysOverdue,
        decision: result.decision,
        language,
      });

      await Invoice.findByIdAndUpdate(invoice._id, { lastReminderSent: now });
    } catch (err) {
      message = `[AI message failed: ${err.message}]`;
    }
  }

  return {
    invoiceId: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    decision: result.decision,
    reason: result.reason,
    nextSendTime: result.nextSendTime || null,
    daysOverdue: result.daysOverdue || 0,
    message,
    customer: customer
      ? { name: customer.name, businessName: customer.businessName, phone: customer.phone }
      : null,
    invoice: {
      total: invoice.total,
      status: invoice.status,
      dueDate: invoice.dueDate,
    },
  };
};

// POST /api/reminders/evaluate/:invoiceId
const evaluateOne = async (req, res) => {
  const { language = 'Hinglish' } = req.body;
  try {
    const invoice = await Invoice.findOne({ _id: req.params.invoiceId, userId: req.user._id })
      .populate('customerId', 'name businessName phone email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    const result = await buildResult(invoice, language);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/reminders/evaluate-all
const evaluateAll = async (req, res) => {
  const { language = 'Hinglish' } = req.body;
  try {
    const invoices = await Invoice.find({
      userId: req.user._id,
      status: { $in: ['unpaid', 'overdue'] },
    }).populate('customerId', 'name businessName phone email');

    if (invoices.length === 0) return res.json([]);

    const results = await Promise.all(invoices.map((inv) => buildResult(inv, language)));
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { evaluateOne, evaluateAll };
