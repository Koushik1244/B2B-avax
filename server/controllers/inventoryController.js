const Inventory = require('../models/Inventory');

// GET /api/inventory
const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find({ userId: req.user._id })
      .populate('supplierIds', 'name email priceIndex avgDeliveryDays rating')
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (err) {
    console.error('[Inventory] Fetch error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/inventory
const createInventory = async (req, res) => {
  try {
    const { productName, quantity, threshold, supplierIds } = req.body;
    if (!productName) return res.status(400).json({ message: 'productName is required' });

    const item = await Inventory.create({
      userId: req.user._id,
      productName,
      quantity:    Number(quantity)  || 0,
      threshold:   Number(threshold) || 10,
      supplierIds: supplierIds || [],
    });

    const populated = await item.populate('supplierIds', 'name email priceIndex avgDeliveryDays rating');
    res.status(201).json(populated);
  } catch (err) {
    console.error('[Inventory] Create error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/inventory/:id
const updateInventory = async (req, res) => {
  try {
    const { quantity, threshold, supplierIds } = req.body;

    const item = await Inventory.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      {
        ...(quantity    != null && { quantity:    Number(quantity) }),
        ...(threshold   != null && { threshold:   Number(threshold) }),
        ...(supplierIds != null && { supplierIds }),
      },
      { new: true }
    ).populate('supplierIds', 'name email priceIndex avgDeliveryDays rating');

    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (err) {
    console.error('[Inventory] Update error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/inventory/:id
const deleteInventory = async (req, res) => {
  try {
    const item = await Inventory.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[Inventory] Delete error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getInventory, createInventory, updateInventory, deleteInventory };
