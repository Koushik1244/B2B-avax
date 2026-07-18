const Customer = require('../models/Customer');

const create = async (req, res) => {
  const { name, phone, email, businessName } = req.body;
  if (!name) return res.status(400).json({ message: 'Customer name is required' });

  try {
    const customer = await Customer.create({
      userId: req.user._id,
      name, phone, email, businessName,
    });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const customers = await Customer.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { create, getAll, getById, remove };
