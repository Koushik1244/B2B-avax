/**
 * Email Service — Nodemailer + Gmail SMTP
 * Sends invoice creation and payment reminder emails.
 */

const nodemailer = require('nodemailer');

// ─── Transporter ─────────────────────────────────────────────────────────────

const getTransporter = () =>
  nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Shared HTML helpers ──────────────────────────────────────────────────────

const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const emailWrap = (content) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#161616;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 32px;">
            <table width="100%"><tr>
              <td>
                <div style="background:rgba(255,255,255,0.15);display:inline-block;padding:6px 12px;border-radius:8px;font-size:13px;font-weight:700;color:#fff;letter-spacing:0.5px;">SI</div>
              </td>
              <td align="right" style="color:rgba(255,255,255,0.7);font-size:12px;">Smart Invoicing</td>
            </tr></table>
          </td>
        </tr>
        <!-- Body -->
        ${content}
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2a2a2a;text-align:center;color:#555;font-size:11px;">
            Sent via Smart Invoicing Assistant &nbsp;·&nbsp; Powered by AI
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── sendInvoiceEmail ─────────────────────────────────────────────────────────

/**
 * Sends a professional invoice creation email to the customer.
 */
const sendInvoiceEmail = async (customer, invoice) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] EMAIL_USER/EMAIL_PASS not set — skipping invoice email');
    return { skipped: true };
  }
  if (!customer?.email) {
    console.log(`[Email] No email for customer ${customer?.name} — skipping`);
    return { skipped: true };
  }

  const upiLink = `upi://pay?pa=${process.env.UPI_ID || 'business@upi'}&pn=SmartInvoicing&am=${invoice.total}&tn=INV-${invoice.invoiceNumber}`;

  const body = emailWrap(`
    <tr>
      <td style="padding:32px 32px 8px;">
        <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">Hello ${customer.name},</p>
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 24px;">Your invoice is ready</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px;">
        <table width="100%" style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;">
          <tr><td style="padding:20px 24px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Invoice Number</td>
              <td align="right" style="color:#a5b4fc;font-family:monospace;font-size:13px;font-weight:600;">${invoice.invoiceNumber}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:20px 24px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Amount Due</td>
              <td align="right" style="color:#fff;font-size:22px;font-weight:700;">${formatINR(invoice.total)}</td>
            </tr></table>
          </td></tr>
          ${invoice.gstAmount > 0 ? `<tr><td style="padding:12px 24px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#6b7280;font-size:11px;">Subtotal</td>
              <td align="right" style="color:#9ca3af;font-size:12px;">${formatINR(invoice.subtotal)}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:12px 24px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#6b7280;font-size:11px;">GST (${invoice.gstPercent}%)</td>
              <td align="right" style="color:#9ca3af;font-size:12px;">${formatINR(invoice.gstAmount)}</td>
            </tr></table>
          </td></tr>` : ''}
          <tr><td style="padding:20px 24px;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Due Date</td>
              <td align="right" style="color:#fbbf24;font-size:13px;font-weight:600;">${formatDate(invoice.dueDate)}</td>
            </tr></table>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;">
        <p style="color:#6b7280;font-size:12px;margin:0 0 16px;">Pay instantly via UPI:</p>
        <a href="${upiLink}" style="display:inline-block;background:#4f46e5;color:#fff;font-weight:600;font-size:13px;padding:12px 28px;border-radius:10px;text-decoration:none;">
          Pay Now via UPI ₹${invoice.total.toLocaleString('en-IN')}
        </a>
        <p style="color:#555;font-size:11px;margin:16px 0 0;">UPI ID: ${process.env.UPI_ID || 'business@upi'}</p>
      </td>
    </tr>
  `);

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Smart Invoicing" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `Invoice ${invoice.invoiceNumber} — ${formatINR(invoice.total)} due ${formatDate(invoice.dueDate)}`,
    html: body,
  });

  console.log(`[Email] Invoice email sent to ${customer.email} — messageId: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
};

// ─── sendReminderEmail ────────────────────────────────────────────────────────

/**
 * Sends an AI-generated reminder email to the customer.
 */
const sendReminderEmail = async (customer, invoice, aiMessage) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] EMAIL_USER/EMAIL_PASS not set — skipping reminder email');
    return { skipped: true };
  }
  if (!customer?.email) {
    console.log(`[Email] No email for ${customer?.name} — skipping reminder`);
    return { skipped: true };
  }

  const body = emailWrap(`
    <tr>
      <td style="padding:32px 32px 8px;">
        <div style="display:inline-block;background:#7f1d1d;color:#fca5a5;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:16px;letter-spacing:0.5px;">PAYMENT REMINDER</div>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">Hello ${customer.name},</p>
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 24px;">Payment pending for ${invoice.invoiceNumber}</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 24px;">
        <div style="background:#1a0a0a;border:1px solid #7f1d1d;border-left:3px solid #ef4444;border-radius:12px;padding:20px 24px;">
          <p style="color:#fca5a5;font-size:14px;line-height:1.7;margin:0;white-space:pre-line;">${aiMessage}</p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;">
        <table width="100%" style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;">
          <tr><td style="padding:16px 20px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Invoice</td>
              <td align="right" style="color:#a5b4fc;font-family:monospace;font-size:12px;">${invoice.invoiceNumber}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:16px 20px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Outstanding</td>
              <td align="right" style="color:#fff;font-size:16px;font-weight:700;">${formatINR(invoice.total)}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:16px 20px;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Due Date</td>
              <td align="right" style="color:#fbbf24;font-size:12px;font-weight:600;">${formatDate(invoice.dueDate)}</td>
            </tr></table>
          </td></tr>
        </table>
      </td>
    </tr>
  `);

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Smart Invoicing" <${process.env.EMAIL_USER}>`,
    to: customer.email,
    subject: `Payment Reminder — Invoice ${invoice.invoiceNumber} (${formatINR(invoice.total)} overdue)`,
    html: body,
  });

  console.log(`[Email] Reminder email sent to ${customer.email} — messageId: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
};

// ─── sendReorderEmail ─────────────────────────────────────────────────────────

/**
 * Sends a reorder request email to the selected supplier.
 */
const sendReorderEmail = async (supplier, productName, reorderQty) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('[Email] EMAIL_USER/EMAIL_PASS not set — skipping reorder email');
    return { skipped: true };
  }
  if (!supplier?.email) {
    console.log(`[Email] No email for supplier ${supplier?.name} — skipping reorder`);
    return { skipped: true };
  }

  const body = emailWrap(`
    <tr>
      <td style="padding:32px 32px 8px;">
        <div style="display:inline-block;background:#14532d;color:#86efac;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;margin-bottom:16px;letter-spacing:0.5px;">REORDER REQUEST</div>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 4px;">Hello ${supplier.name},</p>
        <h2 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 24px;">Stock reorder required</h2>
      </td>
    </tr>
    <tr>
      <td style="padding:0 32px 32px;">
        <table width="100%" style="background:#1e1e1e;border-radius:12px;border:1px solid #2a2a2a;">
          <tr><td style="padding:20px 24px;border-bottom:1px solid #2a2a2a;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Product</td>
              <td align="right" style="color:#fff;font-size:14px;font-weight:600;">${productName}</td>
            </tr></table>
          </td></tr>
          <tr><td style="padding:20px 24px;">
            <table width="100%"><tr>
              <td style="color:#9ca3af;font-size:12px;">Reorder Quantity</td>
              <td align="right" style="color:#86efac;font-size:22px;font-weight:700;">${reorderQty} units</td>
            </tr></table>
          </td></tr>
        </table>
        <p style="color:#6b7280;font-size:12px;margin:16px 0 0;">
          Please process this reorder at your earliest convenience. Kindly confirm via reply.
        </p>
      </td>
    </tr>
  `);

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from: `"Smart Invoicing" <${process.env.EMAIL_USER}>`,
    to: supplier.email,
    subject: `Reorder Request — ${productName} (${reorderQty} units)`,
    html: body,
  });

  console.log(`[Email] Reorder email sent to ${supplier.email} — messageId: ${info.messageId}`);
  return { sent: true, messageId: info.messageId };
};

module.exports = { sendInvoiceEmail, sendReminderEmail, sendReorderEmail };
