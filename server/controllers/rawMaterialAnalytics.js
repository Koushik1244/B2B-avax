const RawMaterial = require('../models/RawMaterial');

// GET /api/raw-materials/analytics/suppliers
const supplierStats = async (req, res) => {
  try {
    const data = await RawMaterial.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$supplierName',
          totalPurchases: { $sum: '$finalCost' },
          transactions:   { $sum: 1 },
          avgCost:        { $avg: '$pricePerUnit' },
        },
      },
      { $sort: { transactions: -1 } },
      {
        $project: {
          _id: 0,
          supplierName:   '$_id',
          totalPurchases: { $round: ['$totalPurchases', 2] },
          transactions:   1,
          avgCost:        { $round: ['$avgCost', 2] },
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    console.error('[SupplierStats] Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/raw-materials/analytics/materials
const materialAnalytics = async (req, res) => {
  try {
    const data = await RawMaterial.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id:        '$materialName',
          totalQty:   { $sum: '$quantity' },
          totalSpend: { $sum: '$finalCost' },
        },
      },
      { $sort: { totalSpend: -1 } },
      {
        $project: {
          _id: 0,
          materialName: '$_id',
          totalQty:     1,
          totalSpend:   { $round: ['$totalSpend', 2] },
        },
      },
    ]);
    res.json(data);
  } catch (err) {
    console.error('[MaterialAnalytics] Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/raw-materials/analytics/gst
const totalGST = async (req, res) => {
  try {
    const result = await RawMaterial.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id:          null,
          totalGST:     { $sum: '$gstAmount' },
          totalBase:    { $sum: '$baseCost' },
          totalFinal:   { $sum: '$finalCost' },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    const summary = result[0] || { totalGST: 0, totalBase: 0, totalFinal: 0, totalRecords: 0 };
    res.json({
      totalGST:     parseFloat((summary.totalGST   || 0).toFixed(2)),
      totalBase:    parseFloat((summary.totalBase   || 0).toFixed(2)),
      totalFinal:   parseFloat((summary.totalFinal  || 0).toFixed(2)),
      totalRecords: summary.totalRecords || 0,
    });
  } catch (err) {
    console.error('[TotalGST] Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/raw-materials/analytics/monthly
const monthlySpend = async (req, res) => {
  try {
    const data = await RawMaterial.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: {
            year:  { $year:  '$purchaseDate' },
            month: { $month: '$purchaseDate' },
          },
          totalSpend: { $sum: '$finalCost' },
          purchases:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id:        0,
          year:       '$_id.year',
          month:      '$_id.month',
          totalSpend: { $round: ['$totalSpend', 2] },
          purchases:  1,
        },
      },
    ]);

    // Format month labels
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const formatted = data.map(d => ({
      label:      `${MONTHS[d.month - 1]} ${d.year}`,
      totalSpend: d.totalSpend,
      purchases:  d.purchases,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[MonthlySpend] Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { supplierStats, materialAnalytics, totalGST, monthlySpend };
