const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');

/**
 * GET /api/analytics/advanced
 * Advanced analytics using MongoDB aggregation pipelines.
 */
const getAdvancedAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    // ── 1. Top customers by revenue ─────────────────────────────────────────
    const topCustomers = await Invoice.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$customerId',
        totalRevenue: { $sum: '$total' },
        invoiceCount: { $sum: 1 },
        paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      }},
      { $unwind: '$customer' },
      { $project: {
        _id: 0,
        name: '$customer.name',
        businessName: '$customer.businessName',
        totalRevenue: 1,
        invoiceCount: 1,
        paidCount: 1,
        paymentRate: {
          $cond: [
            { $gt: ['$invoiceCount', 0] },
            { $round: [{ $multiply: [{ $divide: ['$paidCount', '$invoiceCount'] }, 100] }, 0] },
            0,
          ],
        },
      }},
    ]);

    // ── 2. Most sold products (by revenue) ──────────────────────────────────
    const mostSoldProducts = await Invoice.aggregate([
      { $match: { userId } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalQty: { $sum: '$items.qty' },
        totalRevenue: { $sum: { $multiply: ['$items.qty', '$items.rate'] } },
        occurrences: { $sum: 1 },
        avgRate: { $avg: '$items.rate' },
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      { $project: {
        _id: 0,
        product: '$_id',
        totalQty: 1,
        totalRevenue: 1,
        occurrences: 1,
        avgRate: { $round: ['$avgRate', 0] },
      }},
    ]);

    // ── 3. Repeat vs new customers ───────────────────────────────────────────
    const invoiceCountsPerCustomer = await Invoice.aggregate([
      { $match: { userId } },
      { $group: { _id: '$customerId', count: { $sum: 1 } } },
    ]);
    const repeatCustomers = invoiceCountsPerCustomer.filter(c => c.count > 1).length;
    const newCustomers = invoiceCountsPerCustomer.length - repeatCustomers;

    // ── 4. Late vs on-time payers (paid invoices only) ───────────────────────
    // "Late" = had a reminder sent before payment (lastReminderSent is set)
    // "On-time" = paid without needing a reminder
    const paidInvoiceStats = await Invoice.aggregate([
      { $match: { userId, status: 'paid' } },
      { $group: {
        _id: null,
        total: { $sum: 1 },
        late: { $sum: { $cond: [{ $ne: ['$lastReminderSent', null] }, 1, 0] } },
      }},
    ]);
    const paymentBehavior = paidInvoiceStats[0]
      ? {
          total: paidInvoiceStats[0].total,
          late: paidInvoiceStats[0].late,
          onTime: paidInvoiceStats[0].total - paidInvoiceStats[0].late,
        }
      : { total: 0, late: 0, onTime: 0 };

    // ── 5. Monthly collection rate (last 6 months) ───────────────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Invoice.aggregate([
      { $match: { userId, createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        billed: { $sum: '$total' },
        collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$total', 0] } },
        invoiceCount: { $sum: 1 },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        billed: 1,
        collected: 1,
        invoiceCount: 1,
        collectionRate: {
          $cond: [
            { $gt: ['$billed', 0] },
            { $round: [{ $multiply: [{ $divide: ['$collected', '$billed'] }, 100] }, 0] },
            0,
          ],
        },
      }},
    ]);

    res.json({
      topCustomers,
      mostSoldProducts,
      customerSegments: {
        repeatCustomers,
        newCustomers,
        total: invoiceCountsPerCustomer.length,
        repeatRate: invoiceCountsPerCustomer.length > 0
          ? Math.round((repeatCustomers / invoiceCountsPerCustomer.length) * 100)
          : 0,
      },
      paymentBehavior,
      monthlyStats,
    });
  } catch (err) {
    res.status(500).json({ message: 'Analytics error', error: err.message });
  }
};

// ─── GET /api/analytics/top-customers ────────────────────────────────────────
const getTopCustomers = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const data = await Invoice.aggregate([
      { $match: { userId } },
      { $group: {
        _id: '$customerId',
        totalRevenue: { $sum: '$total' },
        invoiceCount: { $sum: 1 },
        paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
      }},
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      { $unwind: '$customer' },
      { $project: {
        _id: 0,
        name: '$customer.name',
        businessName: '$customer.businessName',
        phone: '$customer.phone',
        totalRevenue: 1,
        invoiceCount: 1,
        paidCount: 1,
        paymentRate: {
          $round: [{ $multiply: [{ $divide: ['$paidCount', '$invoiceCount'] }, 100] }, 0],
        },
      }},
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Analytics error', error: err.message });
  }
};

// ─── GET /api/analytics/payment-patterns ─────────────────────────────────────
const getPaymentPatterns = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();

    // On-time: paid and (no reminder was ever sent OR paid before dueDate)
    // Late: paid but had reminder, OR still unpaid/overdue past dueDate
    const allInvoices = await Invoice.find({ userId }).select('status dueDate lastReminderSent ignoredCount total');

    let onTime = 0, late = 0, onTimeRevenue = 0, lateRevenue = 0;

    for (const inv of allInvoices) {
      const isPastDue = inv.dueDate && new Date(inv.dueDate) < now;
      if (inv.status === 'paid') {
        if (inv.lastReminderSent || inv.ignoredCount > 0) {
          late++;
          lateRevenue += inv.total;
        } else {
          onTime++;
          onTimeRevenue += inv.total;
        }
      } else if (isPastDue) {
        late++;
        lateRevenue += inv.total;
      }
    }

    res.json({ onTime, late, onTimeRevenue, lateRevenue, total: onTime + late });
  } catch (err) {
    res.status(500).json({ message: 'Analytics error', error: err.message });
  }
};

// ─── GET /api/analytics/products ─────────────────────────────────────────────
const getTopProducts = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const data = await Invoice.aggregate([
      { $match: { userId } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.name',
        totalQty: { $sum: '$items.qty' },
        totalRevenue: { $sum: { $multiply: ['$items.qty', '$items.rate'] } },
        avgRate: { $avg: '$items.rate' },
        invoiceCount: { $sum: 1 },
      }},
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
      { $project: {
        _id: 0,
        product: '$_id',
        totalQty: 1,
        totalRevenue: 1,
        invoiceCount: 1,
        avgRate: { $round: ['$avgRate', 0] },
      }},
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Analytics error', error: err.message });
  }
};

module.exports = { getAdvancedAnalytics, getTopCustomers, getPaymentPatterns, getTopProducts };
