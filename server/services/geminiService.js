const https = require('https');

const LANGUAGE_INSTRUCTIONS = {
  Hinglish: 'Write in Hinglish (natural mix of Hindi and English, like "bhai payment kar do", "please check kar lo"). Use Devanagari words phonetically in English script.',
  English: 'Write in clear, professional Indian English.',
  Hindi: 'Write entirely in Hindi using English script (Hinglish romanization). Example: "Aapka bhugtaan abhi bhi baaki hai."',
  Marathi: 'Write entirely in Marathi using English script. Example: "Aapli payment abhi baaki ahe."',
  Tamil: 'Write entirely in Tamil using English script. Example: "Ungal payment innuma varavillai."',
};

// Fallback messages when Gemini is unavailable — keyed by language + decision
const FALLBACK_MESSAGES = {
  Hinglish: {
    SEND:     (name, inv, amt) => `Hi ${name} bhai! 🙏\nInvoice #${inv} ke ₹${amt} abhi bhi pending hain.\nPlease jaldi payment kar do. Shukriya!`,
    ESCALATE: (name, inv, amt) => `${name} ji, yeh urgent hai! ⚠️\nInvoice #${inv} ka ₹${amt} kaafi time se overdue hai.\nAaj hi payment karein, warna aage action lena padega.`,
  },
  English: {
    SEND:     (name, inv, amt) => `Hi ${name},\nThis is a gentle reminder that Invoice #${inv} for ₹${amt} is due.\nKindly make the payment at your earliest convenience. Thank you!`,
    ESCALATE: (name, inv, amt) => `Dear ${name},\nInvoice #${inv} for ₹${amt} is significantly overdue. ⚠️\nImmediate payment is required to avoid further escalation. Please contact us if there's an issue.`,
  },
  Hindi: {
    SEND:     (name, inv, amt) => `${name} ji, namaste! 🙏\nInvoice #${inv} ki ₹${amt} rashi baaki hai.\nKripya jald se jald bhugtan karein. Dhanyavaad!`,
    ESCALATE: (name, inv, amt) => `${name} ji, yeh ek ati-aavashyak soochna hai! ⚠️\nInvoice #${inv} ki ₹${amt} rashi kafi samay se baki hai.\nAaj hi bhugtan karein.`,
  },
  Marathi: {
    SEND:     (name, inv, amt) => `${name} ji, namaskar! 🙏\nInvoice #${inv} chi ₹${amt} rakkam baaki ahe.\nKrupaya lavkar payment kara. Dhanyavaad!`,
    ESCALATE: (name, inv, amt) => `${name} ji, he ati-mahatvache ahe! ⚠️\nInvoice #${inv} chi ₹${amt} khup vel baki ahe.\nAajach payment kara.`,
  },
  Tamil: {
    SEND:     (name, inv, amt) => `Vanakkam ${name}! 🙏\nInvoice #${inv} worth ₹${amt} innuma pending aaga irukku.\nTayavu seithu payment pannunga. Nandri!`,
    ESCALATE: (name, inv, amt) => `${name} avargale, ithu miga avasaram! ⚠️\nInvoice #${inv} worth ₹${amt} romba naala overdue aaga irukku.\nUdanadi payment pannunga.`,
  },
};

const getFallback = (customerName, invoiceNumber, amount, decision, language) => {
  const lang = FALLBACK_MESSAGES[language] || FALLBACK_MESSAGES['Hinglish'];
  const decisionKey = decision === 'ESCALATE' ? 'ESCALATE' : 'SEND';
  const fn = lang[decisionKey];
  return fn(customerName, invoiceNumber, `${Number(amount).toLocaleString('en-IN')}`);
};

const generateReminderMessage = ({ customerName, businessName, invoiceNumber, amount, daysOverdue, decision, language = 'Hinglish' }) => {
  return new Promise((resolve) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('[Gemini] GEMINI_API_KEY is not set — using fallback message');
      return resolve(getFallback(customerName, invoiceNumber, amount, decision, language));
    }

    const tone = decision === 'ESCALATE'
      ? 'firm and urgent — the customer is significantly late, emphasize urgency without being rude'
      : 'friendly and warm — this is a gentle reminder';

    const overdueText = daysOverdue > 0
      ? `The invoice is ${daysOverdue} days overdue.`
      : 'The invoice is due soon.';

    const langInstruction = LANGUAGE_INSTRUCTIONS[language] || LANGUAGE_INSTRUCTIONS['Hinglish'];

    const prompt = `You are a WhatsApp message writer for a small Indian business owner.
Write a short reminder message for the following situation:

Customer: ${customerName} (${businessName || customerName})
Invoice #: ${invoiceNumber}
Amount due: ₹${Number(amount).toLocaleString('en-IN')}
${overdueText}
Tone: ${tone}
Language: ${langInstruction}

Rules:
- Keep it under 5 lines, conversational
- Include the invoice number and amount
- Use at most 1 emoji
- End with a short polite closing
- Output ONLY the message, no explanation`;

    // Exact body format required by Gemini REST API
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.75, maxOutputTokens: 220 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (chunk) => { raw += chunk; });
      res.on('end', () => {
        console.log(`[Gemini] HTTP ${res.statusCode} — raw response:`, raw);

        try {
          const parsed = JSON.parse(raw);

          // Surface any API-level error (wrong key, quota exceeded, etc.)
          if (parsed.error) {
            console.error('[Gemini] API error:', JSON.stringify(parsed.error));
            return resolve(getFallback(customerName, invoiceNumber, amount, decision, language));
          }

          // Extract text from the expected path
          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (!text) {
            console.warn('[Gemini] Empty candidates — full response:', JSON.stringify(parsed, null, 2));
            return resolve(getFallback(customerName, invoiceNumber, amount, decision, language));
          }

          resolve(text.trim());
        } catch (parseErr) {
          console.error('[Gemini] JSON parse failed:', parseErr.message, '— raw:', raw);
          resolve(getFallback(customerName, invoiceNumber, amount, decision, language));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[Gemini] Network error:', err.message);
      resolve(getFallback(customerName, invoiceNumber, amount, decision, language));
    });

    req.setTimeout(10000, () => {
      console.warn('[Gemini] Request timed out after 10s — using fallback');
      req.destroy();
      resolve(getFallback(customerName, invoiceNumber, amount, decision, language));
    });

    req.write(body);
    req.end();
  });
};

module.exports = { generateReminderMessage };
