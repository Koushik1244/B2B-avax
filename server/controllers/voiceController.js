const https = require('https');

/**
 * POST /api/voice/parse
 * Body: { command: "Create invoice for Raj 5000 rupees" }
 *
 * Uses Gemini to extract structured invoice fields from natural language.
 * Falls back to regex parser if Gemini fails.
 */
const parseVoiceCommand = async (req, res) => {
  const { command } = req.body;

  if (!command || typeof command !== 'string' || !command.trim()) {
    return res.status(400).json({ success: false, error: 'command is required' });
  }

  // ── Try Gemini first ────────────────────────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const result = await geminiParse(command, apiKey);
      return res.json(result);
    } catch (err) {
      console.warn('[VoiceParser] Gemini failed, using fallback regex:', err.message);
    }
  }

  // ── Fallback regex parser ───────────────────────────────────────────────────
  const fallback = regexParse(command);
  return res.json(fallback);
};

// ─── Gemini extraction ────────────────────────────────────────────────────────

const geminiParse = (command, apiKey) => {
  return new Promise((resolve, reject) => {
    const prompt = `Extract invoice details from this voice/text command and return ONLY a JSON object.

Command: "${command}"

Return this exact JSON structure (no markdown, no explanation):
{
  "customerName": "extracted name or null",
  "amount": number or null,
  "description": "what is being invoiced or null",
  "gstPercent": number (default 18 if not mentioned),
  "dueInDays": number (default 30 if not mentioned)
}

Examples:
"Create invoice for Raj 5000 rupees" → {"customerName":"Raj","amount":5000,"description":null,"gstPercent":18,"dueInDays":30}
"New invoice for Priya Traders wholesale goods 12500 gst 12 due in 15 days" → {"customerName":"Priya Traders","amount":12500,"description":"wholesale goods","gstPercent":12,"dueInDays":15}
"Invoice Suresh Kumar 3000 for rice delivery" → {"customerName":"Suresh Kumar","amount":3000,"description":"rice delivery","gstPercent":18,"dueInDays":30}`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 150 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (gemRes) => {
      let raw = '';
      gemRes.on('data', (chunk) => { raw += chunk; });
      gemRes.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) return reject(new Error(parsed.error.message));

          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (!text) return reject(new Error('Empty Gemini response'));

          // Strip any markdown fences Gemini may add
          const clean = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
          const extracted = JSON.parse(clean);

          if (!extracted.customerName && !extracted.amount) {
            return reject(new Error('Gemini could not extract fields'));
          }

          resolve({
            success: true,
            source: 'gemini',
            parsed: {
              customerName: extracted.customerName || null,
              amount: extracted.amount || null,
              description: extracted.description || null,
              gstPercent: extracted.gstPercent ?? 18,
              dueInDays: extracted.dueInDays ?? 30,
              rawCommand: command,
            },
          });
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });

    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Gemini timeout')); });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ─── Regex fallback ───────────────────────────────────────────────────────────

const regexParse = (text) => {
  const lower = text.toLowerCase().trim();

  const isInvoiceCmd = /\b(create|add|new|make|generate)\b/.test(lower) && /\binvoice\b/.test(lower);
  if (!isInvoiceCmd) {
    return { success: false, source: 'regex', error: 'Not a recognized invoice command. Try: "Create invoice for [Name] [Amount]"' };
  }

  // Amount: 5000 / 5,000 / 5k / ₹5000 / rs 5000
  const amtMatch = lower.match(/(?:rs\.?|₹|amount\s+)([\d,]+(?:\.\d+)?k?)/i)
    || lower.match(/\b(\d[\d,]*(?:\.\d+)?k?)\s*(?:rupees?|rs|inr)?\b/i);

  if (!amtMatch) {
    return { success: false, source: 'regex', error: 'Could not find amount. Try: "Create invoice for Raj 5000"' };
  }

  const raw = amtMatch[1].replace(/,/g, '');
  const amount = raw.endsWith('k') ? parseFloat(raw) * 1000 : parseFloat(raw);
  if (isNaN(amount) || amount <= 0) {
    return { success: false, source: 'regex', error: 'Invalid amount' };
  }

  // Customer name after "for"
  const nameMatch = text.match(/\bfor\s+([A-Za-z][A-Za-z\s]{1,40}?)(?=\s+[\d₹]|\s+rs|\s+amount|$)/i);
  if (!nameMatch) {
    return { success: false, source: 'regex', error: 'Could not find customer name. Try: "Create invoice for [Name] [Amount]"' };
  }

  const gstMatch = lower.match(/gst\s+(\d+)/);
  const daysMatch = lower.match(/due\s+in\s+(\d+)\s*days?/);

  return {
    success: true,
    source: 'regex',
    parsed: {
      customerName: nameMatch[1].trim(),
      amount,
      description: null,
      gstPercent: gstMatch ? parseInt(gstMatch[1]) : 18,
      dueInDays: daysMatch ? parseInt(daysMatch[1]) : 30,
      rawCommand: text,
    },
  };
};

module.exports = { parseVoiceCommand };
