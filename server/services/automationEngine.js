/**
 * Workflow Automation Engine
 * Handles event-driven side effects: invoice created, payment received, smart reminders.
 */

const Invoice = require('../models/Invoice');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { checkInventoryAndReorder } = require('./inventoryService');
const { decideNotificationAction } = require('./reminderService');
const { generateReminderMessage } = require('./geminiService');
const { sendInvoiceEmail, sendReminderEmail } = require('./emailService');

// ─── WhatsApp helper ──────────────────────────────────────────────────────────

const buildWhatsAppLink = (phone, message) => {
  const digits = (phone || '').replace(/\D/g, '');
  const number = digits.startsWith('91') ? digits : `91${digits}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

// ─── Simple event logger (no extra model needed) ──────────────────────────────

const log = (event, detail) =>
  console.log(`[AUTOMATION ${new Date().toISOString()}] ${event} — ${detail}`);

// ─── Save notification helper ─────────────────────────────────────────────────

const saveNotification = async (userId, { title, message, type, invoiceId, customerId, priority }) => {
  try {
    await Notification.create({ userId, title, message, type, invoiceId, customerId, priority });
  } catch (err) {
    console.warn('[Notification] Failed to save:', err.message);
  }
};

// ─── Event handlers ───────────────────────────────────────────────────────────

/**
 * Triggered immediately after an invoice is created.
 */
const handleInvoiceCreated = async (invoice, customer) => {
  const due = new Date(invoice.dueDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const waMessage =
    `Hi ${customer.name}! 🧾\n` +
    `Invoice #${invoice.invoiceNumber} of ₹${invoice.total.toLocaleString('en-IN')} has been created.\n` +
    `Due date: ${due}\n` +
    `Please make the payment on time. Thank you!`;

  const waLink = customer.phone ? buildWhatsAppLink(customer.phone, waMessage) : null;

  const result = {
    event: 'invoice_created',
    invoiceNumber: invoice.invoiceNumber,
    customer: customer.name,
    whatsappMessage: waMessage,
    whatsappLink: waLink,
    log: `Invoice ${invoice.invoiceNumber} created → notification prepared for ${customer.name}`,
  };

  log('invoice_created', result.log);

  // Send email (non-blocking)
  sendInvoiceEmail(customer, invoice).catch(err =>
    console.warn('[Email] Invoice email failed:', err.message)
  );

  // Save notification
  await saveNotification(invoice.userId, {
    title: `Invoice ${invoice.invoiceNumber} created`,
    message: `New invoice of ₹${invoice.total.toLocaleString('en-IN')} created for ${customer.name}. Due: ${due}.`,
    type: 'invoice_created',
    invoiceId: invoice._id,
    customerId: customer._id,
    priority: 'low',
  });

  return result;
};

/**
 * Triggered when a payment is marked received.
 * Sets status=paid, clears reminder schedule, resets ignoredCount.
 */
const handlePaymentReceived = async (invoiceId) => {
  const invoice = await Invoice.findByIdAndUpdate(
    invoiceId,
    { status: 'paid', lastReminderSent: null, ignoredCount: 0 },
    { new: true }
  ).populate('customerId', 'name');

  if (!invoice) throw new Error('Invoice not found');

  const detail = `Payment received for ${invoice.invoiceNumber} (${invoice.customerId?.name}) ₹${invoice.total} — reminders suppressed, ignoredCount reset`;
  log('payment_received', detail);

  // Save notification
  await saveNotification(invoice.userId, {
    title: `Payment received — ${invoice.invoiceNumber}`,
    message: `${invoice.customerId?.name} paid ₹${invoice.total.toLocaleString('en-IN')} for invoice ${invoice.invoiceNumber}.`,
    type: 'payment_received',
    invoiceId: invoice._id,
    customerId: invoice.customerId?._id,
    priority: 'low',
  });

  return {
    event: 'payment_received',
    invoiceNumber: invoice.invoiceNumber,
    customer: invoice.customerId?.name,
    amount: invoice.total,
    log: detail,
  };
};

/**
 * Smart reminder run: activity-aware, priority-sorted, WhatsApp links included.
 * Uses decideNotificationAction(user, customer, invoice).
 */
const runSmartReminders = async (userId, language = 'Hinglish') => {
  // Fetch the business owner for active-user check
  const owner = await User.findById(userId).select('lastActiveAt');

  const invoices = await Invoice.find({
    userId,
    status: { $in: ['unpaid', 'overdue'] },
  }).populate('customerId', 'name businessName phone email lastActiveAt reminderIgnoreCount');

  const results = [];

  for (const invoice of invoices) {
    const customer = invoice.customerId;
    const decision = decideNotificationAction(owner, customer, invoice);

    let message = null;
    let whatsappLink = null;

    if (decision.action === 'sent' || decision.action === 'escalated') {
      const daysOverdue = invoice.dueDate
        ? Math.max(0, Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)))
        : 0;

      try {
        message = await generateReminderMessage({
          customerName: customer?.name || 'Customer',
          businessName: customer?.businessName || '',
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.total,
          daysOverdue,
          decision: decision.action === 'escalated' ? 'ESCALATE' : 'SEND',
          language,
        });

        // Update invoice: stamp reminder time + increment ignoredCount
        await Invoice.findByIdAndUpdate(invoice._id, {
          lastReminderSent: new Date(),
          $inc: { ignoredCount: 1 },
        });

        if (customer?.phone && message) {
          whatsappLink = buildWhatsAppLink(customer.phone, message);
        }

        // Send reminder email (non-blocking)
        if (message) {
          sendReminderEmail(customer, invoice, message).catch(err =>
            console.warn('[Email] Reminder email failed:', err.message)
          );
        }

        // Save notification
        const isEscalation = decision.action === 'escalated';
        await saveNotification(userId, {
          title: isEscalation
            ? `Escalation sent — ${invoice.invoiceNumber}`
            : `Reminder sent — ${invoice.invoiceNumber}`,
          message: `${isEscalation ? 'Urgent reminder' : 'Reminder'} sent to ${customer?.name} for ₹${invoice.total.toLocaleString('en-IN')} (${invoice.invoiceNumber}).`,
          type: isEscalation ? 'escalation' : 'reminder_sent',
          invoiceId: invoice._id,
          customerId: customer?._id,
          priority: isEscalation ? 'high' : 'medium',
        });
      } catch (err) {
        message = `[AI error: ${err.message}]`;
      }

      log('reminder_sent', `${invoice.invoiceNumber} → ${customer?.name} (${decision.action}, priority: ${decision.priority})`);
    }

    results.push({
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      customer: { name: customer?.name, phone: customer?.phone },
      action: decision.action,
      reason: decision.reason,
      priority: decision.priority,
      priorityScore: decision.priorityScore,
      nextSendTime: decision.nextSendTime || null,
      log: decision.log,
      message,
      whatsappLink,
    });
  }

  // Sort: high → medium → low → none
  const ORDER = { high: 0, medium: 1, low: 2, none: 3 };
  results.sort((a, b) => (ORDER[a.priority] ?? 4) - (ORDER[b.priority] ?? 4));

  return results;
};

// ─── Auto-runner (called by server.js setInterval) ───────────────────────────

let _autoRunning = false; // prevent overlapping executions

const autoRunAllUsers = async () => {
  if (_autoRunning) {
    console.log('[AUTO] Previous run still in progress — skipping this tick');
    return;
  }

  _autoRunning = true;
  const startedAt = Date.now();
  console.log(`[AUTO] Starting scheduled reminder run — ${new Date().toISOString()}`);

  try {
    const users = await User.find({}, '_id busyMode').lean();

    let totalSent = 0;
    let totalSuppressed = 0;

    for (const user of users) {
      if (user.busyMode) {
        console.log(`[AUTO] User ${user._id} — busy mode ON, skipping`);
        continue;
      }

      // Check inventory and trigger reorders
      try {
        const reorders = await checkInventoryAndReorder(user._id);
        if (reorders.length > 0) {
          console.log(`[AUTO] Inventory reorders triggered for user ${user._id}: ${reorders.map(r => r.productName).join(', ')}`);
        }
      } catch (err) {
        console.warn(`[AUTO] checkInventoryAndReorder failed for user ${user._id}: ${err.message}`);
      }

      let results;
      try {
        results = await runSmartReminders(user._id);
      } catch (err) {
        console.warn(`[AUTO] runSmartReminders failed for user ${user._id}: ${err.message}`);
        continue;
      }

      for (const r of results) {
        const tag = r.action === 'sent' || r.action === 'escalated' ? 'SEND' :
                    r.action === 'suppressed' ? 'SUPPRESS' :
                    r.action === 'delayed'    ? 'DELAY'    : r.action.toUpperCase();

        console.log(`[AUTO] Invoice ${r.invoiceId} → ${tag} | ${r.customer?.name || 'unknown'} | priority: ${r.priority} | score: ${r.priorityScore}`);

        if (tag === 'SEND' || tag === 'ESCALATE') totalSent++;
        else totalSuppressed++;
      }
    }

    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
    console.log(`[AUTO] Run complete — ${totalSent} reminder(s) sent, ${totalSuppressed} suppressed/delayed — ${elapsed}s`);
  } catch (err) {
    console.error('[AUTO] Fatal error during auto-run:', err.message);
  } finally {
    _autoRunning = false;
  }
};

module.exports = { handleInvoiceCreated, handlePaymentReceived, runSmartReminders, autoRunAllUsers, buildWhatsAppLink };
