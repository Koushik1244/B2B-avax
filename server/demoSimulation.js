/**
 * Demo Simulation Script
 * Run: node demoSimulation.js
 *
 * Simulates the AI reminder engine evaluating all invoices
 * and shows decisions with reasons, priorities, and active/idle scenarios.
 */

require('dotenv').config();
const connectDB = require('./config/db');

// Register all models before any query runs (Mongoose requires this for populate)
const User           = require('./models/User');
const Customer       = require('./models/Customer');       // required for populate('customerId')
const Invoice        = require('./models/Invoice');
const AutomationLog  = require('./models/AutomationLog');  // available for log queries if needed
const Notification   = require('./models/Notification');   // required for any notification-related populate
const { decideNotificationAction } = require('./services/reminderService');

// ── Terminal colors ───────────────────────────────────────────────────────────
const C = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  white:  '\x1b[37m',
  gray:   '\x1b[90m',
};

const actionColor = (action) => {
  if (action === 'escalated')  return C.red;
  if (action === 'sent')       return C.green;
  if (action === 'delayed')    return C.yellow;
  if (action === 'suppressed') return C.gray;
  return C.white;
};

const priorityColor = (p) => {
  if (p === 'high')   return C.red;
  if (p === 'medium') return C.yellow;
  if (p === 'low')    return C.blue;
  return C.gray;
};

const divider = (char = '─', len = 60) => console.log(C.dim + char.repeat(len) + C.reset);

// ── Main ─────────────────────────────────────────────────────────────────────

const simulate = async () => {
  await connectDB();

  const user = await User.findOne({ email: 'demo@kirana.com' });
  if (!user) {
    console.error('Demo user not found. Run: node seed.js');
    process.exit(1);
  }

  const invoices = await Invoice.find({ userId: user._id })
    .populate('customerId', 'name businessName phone lastActiveAt reminderIgnoreCount')
    .sort({ status: 1, dueDate: 1 });

  console.log('\n' + C.bold + C.cyan + '╔══════════════════════════════════════════════════════╗' + C.reset);
  console.log(C.bold + C.cyan + '║     Smart Invoicing — AI Reminder Engine Demo        ║' + C.reset);
  console.log(C.bold + C.cyan + '╚══════════════════════════════════════════════════════╝' + C.reset);
  console.log(`\n${C.gray}User: ${user.name} (${user.email})${C.reset}`);
  console.log(`${C.gray}Last active: ${user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('en-IN') : 'never'}${C.reset}`);
  console.log(`${C.gray}Evaluating ${invoices.length} invoices...${C.reset}\n`);

  // ── Scenario 1: Owner is ACTIVE (within 5 min) ────────────────────────────
  console.log(C.bold + C.yellow + '◉ SCENARIO 1: Owner is currently ACTIVE (just used the app)' + C.reset);
  divider();

  const activeUser = { ...user.toObject(), lastActiveAt: new Date() }; // active right now

  for (const inv of invoices) {
    if (inv.status === 'paid') continue; // skip paid for this scenario
    const d = decideNotificationAction(activeUser, inv.customerId, inv);
    printDecision(inv, d);
  }

  console.log('\n');

  // ── Scenario 2: Owner is IDLE (30 min ago) ────────────────────────────────
  console.log(C.bold + C.green + '◉ SCENARIO 2: Owner is IDLE (last active 30 minutes ago)' + C.reset);
  divider();

  const idleUser = { ...user.toObject(), lastActiveAt: new Date(Date.now() - 30 * 60 * 1000) };

  for (const inv of invoices) {
    const d = decideNotificationAction(idleUser, inv.customerId, inv);
    printDecision(inv, d);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n');
  divider('═');
  console.log(C.bold + '\n  Decision Summary (Idle Owner):' + C.reset);

  const counts = { sent: 0, escalated: 0, suppressed: 0, delayed: 0 };
  for (const inv of invoices) {
    const d = decideNotificationAction(idleUser, inv.customerId, inv);
    counts[d.action] = (counts[d.action] || 0) + 1;
  }

  console.log(`  ${C.green}✓ SEND     ${C.reset}: ${counts.sent || 0}`);
  console.log(`  ${C.red}⚠ ESCALATE ${C.reset}: ${counts.escalated || 0}`);
  console.log(`  ${C.gray}○ SUPPRESS ${C.reset}: ${counts.suppressed || 0}`);
  console.log(`  ${C.yellow}⏸ DELAY    ${C.reset}: ${counts.delayed || 0}`);
  console.log();

  process.exit(0);
};

// ── Print single decision row ─────────────────────────────────────────────────

const printDecision = (inv, d) => {
  const ac  = actionColor(d.action);
  const pc  = priorityColor(d.priority);
  const daysOverdue = inv.dueDate
    ? Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24))
    : 0;

  console.log(
    `  ${C.dim}${inv.invoiceNumber}${C.reset}  ` +
    `${C.white}${(inv.customerId?.name || 'Unknown').padEnd(18)}${C.reset}  ` +
    `${ac}${C.bold}${d.action.toUpperCase().padEnd(10)}${C.reset}  ` +
    `${pc}[${d.priority}]${C.reset}  ` +
    `₹${String(inv.total.toLocaleString('en-IN')).padStart(8)}` +
    (daysOverdue > 0 ? `  ${C.red}${daysOverdue}d overdue${C.reset}` : '') +
    (inv.ignoredCount > 0 ? `  ${C.yellow}ignored×${inv.ignoredCount}${C.reset}` : '')
  );
  console.log(`  ${C.gray}  ↳ ${d.reason}${C.reset}`);
  if (d.nextSendTime) {
    console.log(`  ${C.yellow}  ↳ Next send: ${new Date(d.nextSendTime).toLocaleString('en-IN')}${C.reset}`);
  }
};

simulate().catch((err) => {
  console.error('Simulation failed:', err.message);
  process.exit(1);
});
