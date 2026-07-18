const mongoose = require('mongoose');
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  qty: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
}, { _id: false });
const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [itemSchema],
  gstPercent: {
    type: Number,
    default: 18,
    min: 0,
    max: 100,
  },
  subtotal: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue'],
    default: 'unpaid',
  },
  dueDate: {
    type: Date,
    required: true,
  },
  lastReminderSent: {
    type: Date,
    default: null,
  },
  ignoredCount: {
    type: Number,
    default: 0,
  },
  riskScore: {
    type: Number,
    default: 0,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  // --- eERC / Avalanche private payment fields ---
  walletAddress: {
    type: String,
    default: null,
  },
  paymentTxHash: {
    type: String,
    default: null,
  },
  paymentType: {
    type: String,
    enum: ['manual', 'eerc'],
    default: 'manual',
  },
  blockchainStatus: {
    type: String,
    enum: ['none', 'pending', 'confirmed', 'failed'],
    default: 'none',
  },
  auditStatus: {
    type: String,
    enum: ['private', 'disclosed'],
    default: 'private',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
module.exports = mongoose.model('Invoice', invoiceSchema);