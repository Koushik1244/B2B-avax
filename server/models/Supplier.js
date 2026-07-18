const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, trim: true },
  priceIndex:      { type: Number, default: 5 },   // lower = cheaper
  avgDeliveryDays: { type: Number, default: 3 },
  rating:          { type: Number, default: 3, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
