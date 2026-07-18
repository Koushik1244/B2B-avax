const https = require('https');
const Invoice = require('../models/Invoice');

/**
 * GET /api/insights
 * Summarises the user's invoice data and asks Gemini for 3 actionable business insights.
 * Falls back to static insights if Gemini is unavailable.
 */
const getInsights = async (req, res) => {
  try {
    const userId = req.user._id;
    const invoices = await Invoice.find({ userId })
      .populate('customerId', 'name businessName');

    // Build a compact summary to send to Gemini
    const total       = invoices.length;
    const paid        = invoices.filter(i => i.status === 'paid').length;
    const overdue     = invoices.filter(i => i.status === 'overdue').length;
    const unpaid      = invoices.filter(i => i.status === 'unpaid').length;
    const totalBilled = invoices.reduce((s, i) => s + i.total, 0);
    const collected   = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
    const collRate    = total > 0 ? Math.round((paid / total) * 100) : 0;
    const avgInvoice  = total > 0 ? Math.round(totalBilled / total) : 0;

    // Top customer by revenue
    const custMap = {};
    invoices.forEach(inv => {
      const n = inv.customerId?.name || 'Unknown';
      custMap[n] = (custMap[n] || 0) + inv.total;
    });
    const topCust = Object.entries(custMap).sort((a, b) => b[1] - a[1])[0];

    // Escalated (ignored 3+ times)
    const escalated = invoices.filter(i => (i.ignoredCount || 0) >= 3).length;

    const summary = [
      `Total invoices: ${total} (paid: ${paid}, unpaid: ${unpaid}, overdue: ${overdue})`,
      `Total billed: ₹${totalBilled.toLocaleString('en-IN')}, collected: ₹${collected.toLocaleString('en-IN')}`,
      `Collection rate: ${collRate}%, average invoice: ₹${avgInvoice.toLocaleString('en-IN')}`,
      topCust ? `Top customer: ${topCust[0]} (₹${topCust[1].toLocaleString('en-IN')})` : '',
      escalated > 0 ? `${escalated} invoice(s) with reminders ignored 3+ times` : 'No ignored reminders',
    ].filter(Boolean).join('\n');

    const insights = await callGemini(summary);
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ message: 'Insights error', error: err.message });
  }
};

// ─── Gemini call ──────────────────────────────────────────────────────────────

const STATIC_FALLBACK = [
  { icon: '💡', title: 'Improve Collections', insight: 'Your collection rate could be improved — consider sending reminders 3 days before the due date to reduce overdue invoices.' },
  { icon: '⚠️', title: 'Follow Up Personally', insight: 'Customers who ignore multiple reminders may need a phone call. Identify your top 3 overdue customers and follow up personally.' },
  { icon: '📈', title: 'Early Payment Incentive', insight: 'Offering a small early-payment discount (1-2%) to your highest-value customers can significantly improve cash flow.' },
];

const callGemini = (summary) => {
  return new Promise((resolve) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return resolve(STATIC_FALLBACK);

    const prompt = `You are a business advisor for an Indian small business owner.
Based on this data:
${summary}

Give exactly 3 short actionable insights in 1 sentence each.
Format as JSON array: [{"icon": "emoji", "title": "Short Title", "insight": "One sentence insight."}]
Use icons from: 💡 ⚠️ 📈 💰 🎯
Return ONLY the JSON array, no markdown, no explanation.`;

    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 250 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, (gemRes) => {
      let raw = '';
      gemRes.on('data', c => { raw += c; });
      gemRes.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (parsed.error) { console.warn('[Insights] Gemini error:', parsed.error.message); return resolve(STATIC_FALLBACK); }

          const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (!text) return resolve(STATIC_FALLBACK);

          const clean = text.replace(/```json?\n?/gi, '').replace(/```/g, '').trim();
          const arr = JSON.parse(clean);
          if (Array.isArray(arr) && arr.length >= 3) {
            // Normalise: support both string array and object array from Gemini
            const normalised = arr.slice(0, 3).map((item, i) => {
              if (typeof item === 'string') {
                const icons = ['💡', '⚠️', '📈'];
                const titles = ['Key Insight', 'Watch Out', 'Growth Tip'];
                return { icon: icons[i], title: titles[i], insight: item };
              }
              return { icon: item.icon || '💡', title: item.title || 'Insight', insight: item.insight || item.text || '' };
            });
            return resolve(normalised);
          }
          resolve(STATIC_FALLBACK);
        } catch {
          resolve(STATIC_FALLBACK);
        }
      });
    });

    req.setTimeout(10000, () => { req.destroy(); resolve(STATIC_FALLBACK); });
    req.on('error', () => resolve(STATIC_FALLBACK));
    req.write(body);
    req.end();
  });
};

module.exports = { getInsights };
