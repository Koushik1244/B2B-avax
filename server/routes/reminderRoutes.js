const express = require('express');
const { evaluateOne, evaluateAll } = require('../controllers/reminderController');
const protect = require('../middleware/authMiddleware');
const { runSmartReminders } = require('../services/automationEngine');
const { parseVoiceCommand } = require('../utils/voiceParser');

const router = express.Router();

router.use(protect);

// Original reminder endpoints
router.post('/evaluate/:invoiceId', evaluateOne);
router.post('/evaluate-all', evaluateAll);

// Smart reminders — activity-aware, priority-sorted, WhatsApp links included
// POST /api/reminders/smart   body: { language?, busyMode? }
router.post('/smart', async (req, res) => {
  try {
    const { language = 'Hinglish', busyMode = false } = req.body;

    // Busy mode: suppress everything without hitting Gemini
    if (busyMode) {
      const Invoice = require('../models/Invoice');
      const pending = await Invoice.find({
        userId: req.user._id,
        status: { $in: ['unpaid', 'overdue'] },
      }).populate('customerId', 'name phone');

      const suppressed = pending.map(inv => ({
        invoiceId: inv._id,
        invoiceNumber: inv.invoiceNumber,
        customer: { name: inv.customerId?.name, phone: inv.customerId?.phone },
        action: 'suppressed',
        reason: 'Owner in busy mode',
        priority: 'none',
        nextSendTime: null,
        log: `[SUPPRESS] ${inv.invoiceNumber} — owner busy mode active`,
        message: null,
        whatsappLink: null,
      }));
      return res.json(suppressed);
    }

    const results = await runSmartReminders(req.user._id, language);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Smart reminder error', error: err.message });
  }
});

// Voice command parser — no DB, pure parse
// POST /api/reminders/parse-voice   body: { command: "Create invoice for Raj 5000" }
router.post('/parse-voice', (req, res) => {
  const { command } = req.body;
  const result = parseVoiceCommand(command);
  res.json(result);
});

module.exports = router;
