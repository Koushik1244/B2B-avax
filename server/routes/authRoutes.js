const express = require('express');
const { register, login, trackActivity, setBusyMode } = require('../controllers/authController');
const { walletNonce, walletVerify } = require('../controllers/walletAuthController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.patch('/activity',  protect, trackActivity);
router.patch('/busy-mode', protect, setBusyMode);

// Wallet login (SIWE-style) — runs alongside email/password auth
router.post('/wallet/nonce', walletNonce);
router.post('/wallet/verify', walletVerify);

module.exports = router;