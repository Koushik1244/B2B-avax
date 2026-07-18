/**
 * OCR Controller
 * Accepts an image upload, runs Tesseract, and parses basic invoice fields.
 *
 * Dependencies: npm install tesseract.js multer
 */

const { createWorker } = require('tesseract.js');

// ─── Text parser ──────────────────────────────────────────────────────────────

const parseInvoiceText = (text) => {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 1);

  // Extract total — look for "Total / Amount / Grand Total" followed by a number
  let total = 0;
  const totalMatch = text.match(
    /(?:grand\s*total|total\s*amount|total|amount)[:\s₹Rs.]*\s*([\d,]+(?:\.\d{1,2})?)/i
  );
  if (totalMatch) {
    total = parseFloat(totalMatch[1].replace(/,/g, ''));
  }

  // Extract items — lines that contain at least one digit and look like a product row
  const items = lines
    .filter(line => /\d/.test(line) && !/^(date|invoice|bill|gstin|address|phone|email)/i.test(line))
    .slice(0, 15)
    .map(line => {
      // Try to detect qty and price at the end: "Product Name  2  500.00"
      const parts = line.split(/\s{2,}|\t/);
      if (parts.length >= 3) {
        const last  = parseFloat(parts[parts.length - 1].replace(/,/g, ''));
        const second = parseFloat(parts[parts.length - 2].replace(/,/g, ''));
        if (!isNaN(last) && !isNaN(second)) {
          return { name: parts.slice(0, -2).join(' '), qty: second, rate: last };
        }
      }
      return { raw: line };
    });

  return { total, items, rawText: text };
};

// ─── Handler ──────────────────────────────────────────────────────────────────

const scanBill = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded' });

    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    const parsed = parseInvoiceText(text);
    res.json(parsed);
  } catch (err) {
    console.error('[OCR] Scan error:', err.message);
    res.status(500).json({ message: 'OCR failed', error: err.message });
  }
};

module.exports = { scanBill };
