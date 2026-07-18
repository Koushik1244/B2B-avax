/**
 * Predictive risk scoring for invoices.
 *
 * Score breakdown (0–105 max):
 *   overdueDays  >15d → +40  |  >7d → +25
 *   amount       >20k → +25  |  >5k → +15
 *   latePayments  each +5, max 20
 *   ignoredCount  each +5, max 20
 *
 * Level:  0–30 = low  |  31–60 = medium  |  61+ = high
 */

/**
 * @param {Object} invoice        - Invoice document (total, dueDate, ignoredCount)
 * @param {Object} customerStats  - { latePayments: Number }
 * @returns {{ score: Number, level: String }}
 */
const calcRisk = (invoice, customerStats = {}) => {
  const now = new Date();

  const overdueDays = invoice.dueDate
    ? Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
    : 0;

  let score = 0;

  // Overdue days component (non-additive — use highest bracket)
  if (overdueDays > 15)      score += 40;
  else if (overdueDays > 7)  score += 25;

  // Amount component (non-additive — use highest bracket)
  const amt = invoice.total || 0;
  if (amt > 20000)      score += 25;
  else if (amt > 5000)  score += 15;

  // Customer late payments: each adds +5, capped at 20
  const latePayments = customerStats.latePayments || 0;
  score += Math.min(latePayments * 5, 20);

  // Ignored reminders: each adds +5, capped at 20
  const ignored = invoice.ignoredCount || 0;
  score += Math.min(ignored * 5, 20);

  const level = score >= 61 ? 'high' : score >= 31 ? 'medium' : 'low';
  return { score, level };
};

module.exports = { calcRisk };
