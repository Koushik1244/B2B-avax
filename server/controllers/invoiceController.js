const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { handleInvoiceCreated, handlePaymentReceived } = require('../services/automationEngine');
const { calcRisk } = require('../services/riskService');
const { spawn } = require('child_process');
const path = require('path');

// Count past overdue invoices for a customer (used as latePayments proxy)
const getLatePayments = (customerId) =>
  Invoice.countDocuments({ customerId, status: 'overdue' });

// Auto-generate invoice number: INV-YYYYMMDD-XXXX
const generateInvoiceNumber = async () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Invoice.countDocuments(); 
  return `INV-${date}-${String(count + 1).padStart(4, '0')}`;
};

// GST calculation
const calcGST = (items, gstPercent) => {
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const gstAmount = parseFloat(((subtotal * gstPercent) / 100).toFixed(2));
  const total = parseFloat((subtotal + gstAmount).toFixed(2));
  return { subtotal: parseFloat(subtotal.toFixed(2)), gstAmount, total };
};

const create = async (req, res) => {
  const { customerId, items, gstPercent, dueDate } = req.body;

  if (!customerId || !items?.length || !dueDate)
    return res.status(400).json({ message: 'customerId, items, and dueDate are required' });

  try {
    const { subtotal, gstAmount, total } = calcGST(items, gstPercent ?? 18);
    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      userId: req.user._id,
      customerId,
      invoiceNumber,
      items,
      gstPercent: gstPercent ?? 18,
      subtotal,
      gstAmount,
      total,
      dueDate,
    });

    const populated = await invoice.populate('customerId', 'name businessName phone email');

    // Calculate and persist risk score
    const latePayments = await getLatePayments(customerId);
    const { score, level } = calcRisk(invoice, { latePayments });
    await Invoice.findByIdAndUpdate(invoice._id, { riskScore: score, riskLevel: level });
    populated.riskScore = score;
    populated.riskLevel = level;

    // Fire automation: generate WhatsApp notification payload (non-blocking)
    const automationResult = handleInvoiceCreated(populated, populated.customerId);
    res.status(201).json({ ...populated.toObject(), automation: automationResult });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const invoices = await Invoice.find({ userId: req.user._id })
      .populate('customerId', 'name businessName phone email')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('customerId', 'name businessName phone email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['paid', 'unpaid', 'overdue'].includes(status))
    return res.status(400).json({ message: 'Invalid status value' });

  try {
    // If marking as paid, use automation engine (it updates status + clears reminders)
    if (status === 'paid') {
      // Verify ownership first
      const owned = await Invoice.exists({ _id: req.params.id, userId: req.user._id });
      if (!owned) return res.status(404).json({ message: 'Invoice not found' });

      const automationResult = await handlePaymentReceived(req.params.id);
      const invoice = await Invoice.findById(req.params.id)
        .populate('customerId', 'name businessName phone email');
      return res.json({ ...invoice.toObject(), automation: automationResult });
    }

    let invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { status },
      { new: true }
    ).populate('customerId', 'name businessName phone email');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Recalculate risk after status change
    const latePayments = await getLatePayments(invoice.customerId._id);
    const { score, level } = calcRisk(invoice, { latePayments });
    invoice = await Invoice.findByIdAndUpdate(
      invoice._id,
      { riskScore: score, riskLevel: level },
      { new: true }
    ).populate('customerId', 'name businessName phone email');

    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const EERC_REPO_PATH = path.join(__dirname, '..', 'eerc-backend-converter');
const RECEIVER_ADDRESS = '0x27443f54472802330eC7fd05A15cd61DfAB45F06'; // business wallet (wallet2)

const runEercTransfer = (amount) => {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'npx',
      ['hardhat', 'run', 'scripts/converter/07_transfer.ts', '--network', 'fuji'],
      {
        cwd: EERC_REPO_PATH,
        env: {
          ...process.env,
          TRANSFER_RECEIVER: RECEIVER_ADDRESS,
          TRANSFER_AMOUNT: String(amount),
        },
        shell: true,
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      const match = stdout.match(/TRANSFER_RESULT_JSON:(\{.*\})/);
      if (match) {
        try {
          const result = JSON.parse(match[1]);
          return resolve(result);
        } catch (e) {
          return reject(new Error('Failed to parse transfer result JSON'));
        }
      }
      const insufficientMatch = stdout.match(/Insufficient balance\. Have: ([\d.]+), Need: ([\d.]+)/);
      if (insufficientMatch) {
        return reject(new Error(`Insufficient balance. Have: ${insufficientMatch[1]}, Need: ${insufficientMatch[2]}`));
      }
      return reject(new Error(`Transfer script exited with code ${code}, no result found. stderr: ${stderr.slice(0, 500)}`));
    });

    child.on('error', (err) => reject(err));
  });
};

const payEerc = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    await Invoice.findByIdAndUpdate(req.params.id, { blockchainStatus: 'pending' });

    const result = await runEercTransfer(invoice.total);

    await Invoice.findByIdAndUpdate(req.params.id, {
      walletAddress: RECEIVER_ADDRESS,
      paymentTxHash: result.txHash,
      paymentType: 'eerc',
      blockchainStatus: 'confirmed',
    });

    const automationResult = await handlePaymentReceived(req.params.id);

    const updated = await Invoice.findById(req.params.id)
      .populate('customerId', 'name businessName phone email');

    res.json({ ...updated.toObject(), automation: automationResult, txResult: result });
  } catch (err) {
    await Invoice.findByIdAndUpdate(req.params.id, { blockchainStatus: 'failed' }).catch(() => {});
    res.status(500).json({ message: 'eERC transfer failed', error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { create, getAll, getById, updateStatus, payEerc, remove };