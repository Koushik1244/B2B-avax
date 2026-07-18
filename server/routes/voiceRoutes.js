const express = require('express');
const { parseVoiceCommand } = require('../controllers/voiceController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

// POST /api/voice/parse   body: { command: "Create invoice for Raj 5000" }
router.post('/parse', parseVoiceCommand);

module.exports = router;
