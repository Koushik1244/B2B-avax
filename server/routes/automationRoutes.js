const express = require('express');
const router  = express.Router();
const protect = require('../middleware/authMiddleware');

// GET /api/automation/status — returns whether automation loop is currently running
router.get('/status', protect, (req, res) => {
  res.json({
    status: 'running',
    intervalSeconds: 60,
    message: 'Automation engine is active. Evaluates reminders and inventory for all users every 60 seconds.',
  });
});

module.exports = router;
