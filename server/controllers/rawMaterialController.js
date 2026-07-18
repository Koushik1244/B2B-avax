const RawMaterial = require('../models/RawMaterial');
const Notification = require('../models/Notification');
const { calculateGST } = require('../services/gstService');

// POST /api/raw-materials
const createRawMaterial = async (req, res) => {
  try {
    const { materialName, supplierName, quantity, pricePerUnit, gstPercent, purchaseDate } = req.body;

    if (!materialName || !supplierName || quantity == null || pricePerUnit == null) {
      return res.status(400).json({ message: 'materialName, supplierName, quantity, and pricePerUnit are required' });
    }

    const gst = Number(gstPercent) || 18;
    const { baseCost, gstAmount, finalCost } = calculateGST({
      pricePerUnit: Number(pricePerUnit),
      quantity: Number(quantity),
      gstPercent: gst,
    });

    const material = await RawMaterial.create({
      userId: req.user._id,
      materialName,
      supplierName,
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      gstPercent: gst,
      baseCost,
      gstAmount,
      finalCost,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
    });

    await Notification.create({
      userId: req.user._id,
      title: `Purchase recorded — ${materialName}`,
      message: `${quantity} units of ${materialName} purchased from ${supplierName} for ₹${finalCost.toLocaleString('en-IN')} (incl. GST).`,
      type: 'purchase_created',
      priority: 'low',
    });

    res.status(201).json(material);
  } catch (err) {
    console.error('[RawMaterial] Create error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/raw-materials
const getRawMaterials = async (req, res) => {
  try {
    const materials = await RawMaterial.find({ userId: req.user._id })
      .sort({ purchaseDate: -1 })
      .lean();
    res.json(materials);
  } catch (err) {
    console.error('[RawMaterial] Fetch error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createRawMaterial, getRawMaterials };
