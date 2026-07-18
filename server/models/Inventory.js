const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  productName: { type: String, required: true, trim: true },
  quantity:    { type: Number, required: true, min: 0, default: 0 },
  threshold:   { type: Number, required: true, min: 0, default: 10 },
  supplierIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }],
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
