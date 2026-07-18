const mongoose = require('mongoose');

const rawMaterialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  materialName: { type: String, required: true, trim: true },
  supplierName:  { type: String, required: true, trim: true },
  quantity:      { type: Number, required: true, min: 0 },
  pricePerUnit:  { type: Number, required: true, min: 0 },
  gstPercent:    { type: Number, enum: [0, 5, 12, 18, 28], default: 18 },
  baseCost:      { type: Number, default: 0 },
  gstAmount:     { type: Number, default: 0 },
  finalCost:     { type: Number, default: 0 },
  purchaseDate:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);
