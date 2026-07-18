/**
 * Voice / Natural-Language Command Parser
 *
 * Extracts invoice intent from plain-text commands.
 *
 * Examples:
 *   "Create invoice for Raj 5000"
 *   "New invoice for Priya Traders 12,500 gst 12"
 *   "Add invoice Kumar amount 7500 rupees"
 *   "Make invoice for Suresh 3k"
 */

const parseVoiceCommand = (text) => {
  if (!text || typeof text !== 'string') {
    return { success: false, error: 'Empty command' };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // Must be a create-invoice intent
  const isCreateIntent = /\b(create|add|new|make|generate)\b/.test(lower);
  const isInvoiceIntent = /\binvoice\b/.test(lower);

  if (!isCreateIntent || !isInvoiceIntent) {
    return {
      success: false,
      error: 'Not a recognized invoice command. Try: "Create invoice for [Name] [Amount]"',
    };
  }

  // ── Extract amount ────────────────────────────────────────────────────────
  // Supports: 5000, 5,000, 5000.50, 5k, ₹5000, rs 5000, amount 5000
  const amountPatterns = [
    /(?:amount|rs\.?|₹)\s*([\d,]+(?:\.\d+)?k?)/i,   // after keyword
    /\bfor\s+\S+(?:\s+\S+)?\s+([\d,]+(?:\.\d+)?k?)/i, // after "for Name"
    /\b([\d,]+(?:\.\d+)?k?)\s*(?:rupees?|rs|inr)?\b/i, // standalone number
  ];

  let rawAmount = null;
  for (const pattern of amountPatterns) {
    const m = lower.match(pattern);
    if (m) { rawAmount = m[1]; break; }
  }

  if (!rawAmount) {
    return { success: false, error: 'Could not find amount. Try: "Create invoice for Raj 5000"' };
  }

  const normalized = rawAmount.replace(/,/g, '');
  const amount = normalized.endsWith('k')
    ? parseFloat(normalized) * 1000
    : parseFloat(normalized);

  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: `Invalid amount: "${rawAmount}"` };
  }

  // ── Extract customer name ─────────────────────────────────────────────────
  // Look for text after "for" and before the amount / end
  const amountStr = rawAmount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape for regex
  const namePatterns = [
    new RegExp(`\\bfor\\s+([A-Za-z][A-Za-z\\s]{1,40}?)(?=\\s+${amountStr}|\\s+amount|\\s+rs|\\s+₹|$)`, 'i'),
    /\bfor\s+([A-Za-z][A-Za-z\s]{1,40}?)(?=\s+\d)/i,
  ];

  let customerName = null;
  for (const pattern of namePatterns) {
    const m = raw.match(pattern);
    if (m) { customerName = m[1].trim(); break; }
  }

  if (!customerName) {
    return { success: false, error: 'Could not find customer name. Try: "Create invoice for [Name] [Amount]"' };
  }

  // ── Extract optional GST ──────────────────────────────────────────────────
  const gstMatch = lower.match(/gst\s+(\d+)/);
  const gstPercent = gstMatch ? parseInt(gstMatch[1], 10) : 18;

  // ── Extract optional due date offset ─────────────────────────────────────
  const daysMatch = lower.match(/due\s+in\s+(\d+)\s*days?/);
  const dueInDays = daysMatch ? parseInt(daysMatch[1], 10) : 30;

  return {
    success: true,
    parsed: {
      customerName,
      amount,
      gstPercent,
      dueInDays,
      rawCommand: raw,
    },
  };
};

module.exports = { parseVoiceCommand };
