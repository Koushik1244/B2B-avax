const Supplier = require('../models/Supplier');

// GET /api/suppliers
const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ userId: req.user._id }).sort({ name: 1 }).lean();
    res.json(suppliers);
  } catch (err) {
    console.error('[Supplier] Fetch error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/suppliers
const createSupplier = async (req, res) => {
  try {
    const { name, email, priceIndex, avgDeliveryDays, rating } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'name and email are required' });

    const supplier = await Supplier.create({
      userId: req.user._id,
      name,
      email,
      priceIndex:      Number(priceIndex)      || 5,
      avgDeliveryDays: Number(avgDeliveryDays)  || 3,
      rating:          Number(rating)           || 3,
    });
    res.status(201).json(supplier);
  } catch (err) {
    console.error('[Supplier] Create error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/suppliers/:id
const deleteSupplier = async (req, res) => {
  try {
    const s = await Supplier.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!s) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Supplier] Delete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSuppliers, createSupplier, deleteSupplier };
