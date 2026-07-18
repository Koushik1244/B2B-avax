const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');

// In-memory nonce store: { [address]: { nonce, expiresAt } }
// Fine for a single-instance demo deploy. If you ever scale to multiple
// server instances, move this to Redis or a DB collection instead.
const nonceStore = new Map();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const genNonce = () => Math.floor(Math.random() * 1e16).toString(36);

const buildSignMessage = (address, nonce) =>
  `Sign this message to log in to AutoBiz Confidential.\n\n` +
  `Wallet: ${address}\n` +
  `Nonce: ${nonce}\n\n` +
  `This request will not trigger a blockchain transaction or cost any gas.`;

// POST /api/auth/wallet/nonce   body: { address }
const walletNonce = async (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ message: 'Valid wallet address is required' });
  }

  const normalized = address.toLowerCase();
  const nonce = genNonce();
  nonceStore.set(normalized, { nonce, expiresAt: Date.now() + NONCE_TTL_MS });

  res.json({ message: buildSignMessage(normalized, nonce) });
};

// POST /api/auth/wallet/verify   body: { address, signature }
const walletVerify = async (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature || !ethers.isAddress(address)) {
    return res.status(400).json({ message: 'address and signature are required' });
  }

  const normalized = address.toLowerCase();
  const entry = nonceStore.get(normalized);

  if (!entry) {
    return res.status(400).json({ message: 'No login request found for this address. Request a nonce first.' });
  }
  if (Date.now() > entry.expiresAt) {
    nonceStore.delete(normalized);
    return res.status(400).json({ message: 'Login request expired. Please try again.' });
  }

  const expectedMessage = buildSignMessage(normalized, entry.nonce);

  let recovered;
  try {
    recovered = ethers.verifyMessage(expectedMessage, signature);
  } catch {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  if (recovered.toLowerCase() !== normalized) {
    return res.status(401).json({ message: 'Signature does not match wallet address' });
  }

  // Signature verified — consume the nonce so it can't be replayed
  nonceStore.delete(normalized);

  try {
    let user = await User.findOne({ walletAddress: normalized });

    if (!user) {
      // No account linked to this wallet yet — create a lightweight
      // wallet-only account. Email/password stays untouched for existing users.
      user = await User.create({
        name: `Wallet ${normalized.slice(0, 6)}…${normalized.slice(-4)}`,
        email: `${normalized}@wallet.local`, // placeholder, unique, satisfies schema
        password: Math.random().toString(36).slice(2) + Date.now(), // random, unused for login
        walletAddress: normalized,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, walletAddress: user.walletAddress },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during wallet login', error: err.message });
  }
};

module.exports = { walletNonce, walletVerify };