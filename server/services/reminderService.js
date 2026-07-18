const { calcRisk } = require('./riskService');

/**
 * Evaluates a single invoice and returns a reminder decision.
 * @param {Object} invoice - Mongoose invoice document (with dueDate, status, lastReminderSent)
 * @returns {{ decision: string, reason: string, nextSendTime?: Date }}
 */
const evaluate = (invoice) => {
  const now = new Date();

  // Rule 1: Already paid
  if (invoice.status === 'paid') {
    return { decision: 'SUPPRESS', reason: 'Customer already paid' };
  }

  // Rule 2: Reminder sent within last 48 hours
  if (invoice.lastReminderSent) {
    const hoursSince = (now - new Date(invoice.lastReminderSent)) / (1000 * 60 * 60);
    if (hoursSince < 48) {
      return { decision: 'SUPPRESS', reason: 'Reminder already sent recently' };
    }
  }

  // Rule 3: Outside business hours (10pm–7am)
  const hour = now.getHours();
  if (hour >= 22 || hour < 7) {
    const next9am = new Date(now);
    if (hour >= 22) next9am.setDate(next9am.getDate() + 1);
    next9am.setHours(9, 0, 0, 0);
    return { decision: 'DELAY', reason: 'Outside business hours', nextSendTime: next9am };
  }

  // Rule 4: Overdue by more than 7 days
  if (invoice.dueDate) {
    const daysOverdue = (now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24);
    if (daysOverdue > 7) {
      return { decision: 'ESCALATE', reason: 'Payment significantly overdue', daysOverdue: Math.floor(daysOverdue) };
    }
  }

  // Rule 5: Default — send
  return { decision: 'SEND', reason: 'Invoice due, reminder appropriate' };
};

// ─── Enhanced notification engine ────────────────────────────────────────────

const HIGH_VALUE_THRESHOLD = 10000; // ₹10,000+  → always priority

/**
 * Calculate numeric priority score (0–110) from invoice context.
 * Returns { priorityScore, priority }
 *
 * Days overdue:  0d=0  1-3d=10  4-7d=25  8-14d=40  15+d=60
 * Amount:        <1k=0  1k-5k=10  5k-10k=20  >10k=30
 * ignoredCount:  0=0  1-2=10  3+=20
 * Final:         0-20=low  21-50=medium  51+=high
 */
const calcPriorityScore = (invoice) => {
  const now = new Date();
  const daysOverdue = invoice.dueDate
    ? Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
    : 0;

  let score = 0;

  // Days overdue component
  if (daysOverdue >= 15)      score += 60;
  else if (daysOverdue >= 8)  score += 40;
  else if (daysOverdue >= 4)  score += 25;
  else if (daysOverdue >= 1)  score += 10;

  // Amount component
  const amt = invoice.total || 0;
  if (amt > 10000)      score += 30;
  else if (amt >= 5000) score += 20;
  else if (amt >= 1000) score += 10;

  // ignoredCount component
  const ignored = invoice.ignoredCount || 0;
  if (ignored >= 3)     score += 20;
  else if (ignored >= 1) score += 10;

  const priority = score >= 51 ? 'high' : score >= 21 ? 'medium' : 'low';
  return { priorityScore: score, priority };
};

/**
 * Context-aware notification decision.
 *
 * @param {Object} user          - Logged-in business owner (has lastActiveAt)
 * @param {Object} customer      - Customer doc (has lastActiveAt, reminderIgnoreCount)
 * @param {Object} invoice       - Invoice doc (status, total, dueDate, ignoredCount)
 * @param {Object} customerStats - Optional { latePayments: Number } for risk scoring
 * @returns {{ action, reason, priority, priorityScore, riskScore, riskLevel, nextSendTime, log }}
 */
const decideNotificationAction = (user, customer, invoice, customerStats = {}) => {
  const now = new Date();

  const daysOverdue = invoice.dueDate
    ? Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
    : 0;

  const { priorityScore, priority } = calcPriorityScore(invoice);

  // Risk scoring (predictive — uses customer history)
  const { score: riskScore, level: riskLevel } = calcRisk(invoice, customerStats);

  // Rule 1: Paid → hard suppress
  if (invoice.status === 'paid') {
    return {
      action: 'suppressed',
      reason: 'Invoice already paid — no reminder needed',
      priority: 'none',
      priorityScore: 0,
      riskScore,
      riskLevel,
      nextSendTime: null,
      log: `[SUPPRESS] Invoice ${invoice.invoiceNumber} — already paid`,
    };
  }

  // Rule 2: Business owner is actively using the app (within last 5 min) → delay
  const ownerLastActive = user?.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const ownerIdleMinutes = ownerLastActive ? (now - ownerLastActive) / (1000 * 60) : Infinity;

  if (ownerIdleMinutes < 5) {
    const next = new Date(now.getTime() + 5 * 60 * 1000);
    return {
      action: 'delayed',
      reason: 'User is currently active — will send in 5 minutes',
      priority,
      priorityScore,
      riskScore,
      riskLevel,
      nextSendTime: next,
      log: `[DELAY] Owner active ${Math.floor(ownerIdleMinutes)}m ago — holding notification`,
    };
  }

  // Rule 3: Reminder ignored 3+ times → escalate
  const ignoredCount = invoice.ignoredCount || 0;
  if (ignoredCount >= 3) {
    return {
      action: 'escalated',
      reason: `Reminder ignored ${ignoredCount} times — escalating to urgent tone`,
      priority: 'high',
      priorityScore,
      riskScore,
      riskLevel,
      nextSendTime: null,
      log: `[ESCALATE] ${customer?.name} ignored ${ignoredCount} reminders — urgent escalation`,
    };
  }

  // Rule 4: High-value OR overdue > 7 days → send immediately
  const isHighValue = invoice.total >= HIGH_VALUE_THRESHOLD;
  if (daysOverdue > 7 || isHighValue) {
    const reason = daysOverdue > 7
      ? `Invoice overdue by ${daysOverdue} days — urgent follow-up`
      : `High-value invoice ₹${invoice.total.toLocaleString('en-IN')} — priority collection`;
    return {
      action: daysOverdue > 7 ? 'escalated' : 'sent',
      reason,
      priority: 'high',
      priorityScore,
      riskScore,
      riskLevel,
      nextSendTime: null,
      log: `[${daysOverdue > 7 ? 'ESCALATE' : 'SEND'}] ${reason}`,
    };
  }

  // Rule 5: Default → send
  return {
    action: 'sent',
    reason: daysOverdue > 0
      ? `Invoice overdue by ${daysOverdue} day(s) — reminder appropriate`
      : 'Invoice due — sending friendly reminder',
    priority,
    priorityScore,
    riskScore,
    riskLevel,
    nextSendTime: null,
    log: `[SEND] ${customer?.name} — score ${priorityScore} (${priority})`,
  };
};

module.exports = { evaluate, decideNotificationAction };
