const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:    { type: String, required: true },   // e.g. 'reminder_sent', 'reorder_triggered'
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
  details:   { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AutomationLog', automationLogSchema);
