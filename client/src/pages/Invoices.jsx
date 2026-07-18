  import { useEffect, useState, useRef } from 'react';
  import { QRCodeSVG } from 'qrcode.react';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';
  import {
    getInvoices,
    createInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getCustomers,
    simulatePayment,
    evaluateReminderForInvoice,
  } from '../services/api';
  import api from '../services/api';
  import { IoClose } from 'react-icons/io5';
  import BizCard from '../components/ui/BizCard';
  import PageHeader from '../components/ui/PageHeader';

  /** UI status: paid (green), due soon (orange), overdue (red), unpaid (amber) */
  function deriveUiStatus(inv) {
    if (inv.status === 'paid') {
      return {
        key: 'paid',
        label: 'Paid',
        cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      };
    }
    const due = new Date(inv.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDay = new Date(due);
    dueDay.setHours(0, 0, 0, 0);
    const days = (dueDay - today) / 86400000;
    if (inv.status === 'overdue' || days < 0) {
      return { key: 'overdue', label: 'Overdue', cls: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' };
    }
    if (days <= 7) {
      return { key: 'due_soon', label: 'Due soon', cls: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200' };
    }
    return { key: 'unpaid', label: 'Unpaid', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200' };
  }

  const emptyForm = {
    customerId: '', gstPercent: 18, dueDate: '',
    items: [{ name: '', qty: 1, rate: '' }],
  };

  const calcTotals = (items, gstPercent) => {
    const subtotal = items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
    const gstAmount = parseFloat(((subtotal * gstPercent) / 100).toFixed(2));
    return { subtotal: parseFloat(subtotal.toFixed(2)), gstAmount, total: parseFloat((subtotal + gstAmount).toFixed(2)) };
  };

  const generatePDF = (invoice) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text('TAX INVOICE', 14, 22);

    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('Smart Invoicing Assistant', 14, 30);
    doc.text('GST Compliant Invoice', 14, 35);

    // Invoice meta (right)
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    doc.text(`Invoice #: ${invoice.invoiceNumber}`, 130, 22);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('en-IN')}`, 130, 28);
    doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}`, 130, 34);
    doc.text(`Status: ${invoice.status.toUpperCase()}`, 130, 40);

    // Divider
    doc.setDrawColor(200, 200, 220);
    doc.line(14, 44, 196, 44);

    // Bill to
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('BILL TO', 14, 52);
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(invoice.customerId?.name || 'Customer', 14, 59);
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    if (invoice.customerId?.businessName) doc.text(invoice.customerId.businessName, 14, 65);
    if (invoice.customerId?.phone) doc.text(`Ph: ${invoice.customerId.phone}`, 14, 71);

    // Items table
    autoTable(doc, {
      startY: 82,
      head: [['#', 'Description', 'Qty', 'Rate (₹)', 'Amount (₹)']],
      body: invoice.items.map((item, i) => [
        i + 1,
        item.name,
        item.qty,
        Number(item.rate).toLocaleString('en-IN'),
        (item.qty * item.rate).toLocaleString('en-IN'),
      ]),
      foot: [
        ['', '', '', 'Subtotal', `₹${invoice.subtotal.toLocaleString('en-IN')}`],
        ['', '', '', `GST (${invoice.gstPercent}%)`, `₹${invoice.gstAmount.toLocaleString('en-IN')}`],
        ['', '', '', 'TOTAL', `₹${invoice.total.toLocaleString('en-IN')}`],
      ],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      footStyles: { fontStyle: 'bold', textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [248, 248, 252] },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 80 } },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 14, finalY);

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  function QRModal({ invoice, onClose }) {
    const upiLink = `upi://pay?pa=demo@kirana&pn=${encodeURIComponent(invoice.customerId?.name || 'Customer')}&am=${invoice.total}&tn=${encodeURIComponent(invoice.invoiceNumber)}&cu=INR`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
        <div
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-600 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">UPI payment QR</p>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200" aria-label="Close">
              <IoClose className="h-6 w-6" />
            </button>
          </div>
          <div className="mb-4 flex justify-center rounded border border-slate-100 bg-white p-4">
            <QRCodeSVG value={upiLink} size={180} />
          </div>
          <div className="text-center">
            <p className="mb-1 text-xs text-slate-500">{invoice.invoiceNumber}</p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">₹{invoice.total?.toLocaleString('en-IN')}</p>
            <p className="mt-1 text-xs text-slate-500">{invoice.customerId?.name}</p>
          </div>
          <p className="mt-3 text-center text-[10px] text-slate-500">Scan with any UPI app to pay</p>
        </div>
      </div>
    );
  }

  function InvoiceDetailModal({ invoice, onClose }) {
    if (!invoice) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
        <div
          className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-600 dark:bg-slate-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Invoice detail</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
              <IoClose className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-3 p-4 text-sm">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-slate-500">Number</span>
              <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
              <span className="text-slate-500">Customer</span>
              <span>{invoice.customerId?.name}</span>
              <span className="text-slate-500">Date</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</span>
              <span className="text-slate-500">Due</span>
              <span>{new Date(invoice.dueDate).toLocaleDateString('en-IN')}</span>
              <span className="text-slate-500">Total</span>
              <span className="font-semibold">₹{invoice.total?.toLocaleString('en-IN')}</span>
            </div>
            <table className="w-full border border-slate-200 text-xs dark:border-slate-700">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800">
                  <th className="px-2 py-1.5 text-left">Item</th>
                  <th className="px-2 py-1.5 text-right">Qty</th>
                  <th className="px-2 py-1.5 text-right">Rate</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((it, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-2 py-1.5">{it.name}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{it.qty}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">₹{Number(it.rate).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  export default function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [qrInvoice, setQrInvoice] = useState(null);
    const [simulatingId, setSimulatingId] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [viewInv, setViewInv] = useState(null);
    const [reminderBusy, setReminderBusy] = useState(null);

    // ── Voice input state ──────────────────────────────────────────────────────
    const [voiceState, setVoiceState] = useState('idle'); // idle | listening | parsing | done | error
    const [voiceHint, setVoiceHint] = useState('');
    const recognitionRef = useRef(null);

    const startVoiceInput = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceHint('Voice input not supported in this browser. Try Chrome.');
        setVoiceState('error');
        return;
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
        setVoiceHint('Listening... Say something like "Create invoice for Raj 5000 rupees"');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceState('parsing');
        setVoiceHint(`Heard: "${transcript}" — parsing...`);

        try {
          const { data } = await api.post('/voice/parse', { command: transcript });
          if (!data.success) {
            setVoiceHint(`Could not parse: ${data.error}`);
            setVoiceState('error');
            return;
          }

          const { customerName, amount, description, gstPercent, dueInDays } = data.parsed;

          // Find matching customer (case-insensitive partial match)
          const matchedCustomer = customers.find(c =>
            c.name.toLowerCase().includes(customerName?.toLowerCase() || '__none__')
          );

          const dueDate = new Date(Date.now() + (dueInDays ?? 30) * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];

          setForm(prev => ({
            ...prev,
            customerId: matchedCustomer?._id || prev.customerId,
            gstPercent: gstPercent ?? 18,
            dueDate,
            items: [{
              name: description || (amount ? `Invoice item` : prev.items[0]?.name || ''),
              qty: 1,
              rate: amount || prev.items[0]?.rate || '',
            }],
          }));

          setVoiceState('done');
          setVoiceHint(
            `Filled! Customer: ${matchedCustomer?.name || customerName || '(select manually)'} · ` +
            `Amount: ₹${Number(amount).toLocaleString('en-IN')} · ` +
            `GST: ${gstPercent}%`
          );
        } catch {
          setVoiceHint('Parsing failed. Please fill the form manually.');
          setVoiceState('error');
        }
      };

      recognition.onerror = (e) => {
        setVoiceHint(`Mic error: ${e.error}. Try again.`);
        setVoiceState('error');
      };

      recognition.onend = () => {
        if (voiceState === 'listening') setVoiceState('idle');
      };

      setShowForm(true);
      recognition.start();
    };

    const stopVoice = () => {
      recognitionRef.current?.stop();
      setVoiceState('idle');
      setVoiceHint('');
    };

    const fetchData = async () => {
      try {
        const [{ data: inv }, { data: cust }] = await Promise.all([getInvoices(), getCustomers()]);
        setInvoices(inv);
        setCustomers(cust);
      } catch { setError('Failed to load data'); }
      finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = invoices.filter((inv) => {
      const cid = inv.customerId?._id || inv.customerId;
      if (customerFilter && cid !== customerFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const num = inv.invoiceNumber?.toLowerCase() || '';
        const nm = inv.customerId?.name?.toLowerCase() || '';
        if (!num.includes(q) && !nm.includes(q)) return false;
      }
      if (dateFrom && new Date(inv.createdAt) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(inv.createdAt) > end) return false;
      }
      const ui = deriveUiStatus(inv);
      if (statusFilter === 'all') return true;
      if (statusFilter === 'paid') return inv.status === 'paid';
      if (statusFilter === 'overdue') return ui.key === 'overdue';
      if (statusFilter === 'due_soon') return ui.key === 'due_soon';
      if (statusFilter === 'unpaid') return ui.key === 'unpaid';
      return true;
    });

    const setField = (f, v) => setForm(p => ({ ...p, [f]: v }));
    const setItem = (idx, f, v) => setForm(p => ({ ...p, items: p.items.map((it, i) => i === idx ? { ...it, [f]: v } : it) }));
    const addItem = () => setForm(p => ({ ...p, items: [...p.items, { name: '', qty: 1, rate: '' }] }));
    const removeItem = (idx) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true); setError('');
      try {
        const { data } = await createInvoice({
          ...form,
          gstPercent: Number(form.gstPercent),
          items: form.items.map(i => ({ name: i.name, qty: Number(i.qty), rate: Number(i.rate) })),
        });
        setInvoices(p => [data, ...p]);
        setForm(emptyForm); setShowForm(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to create invoice');
      } finally { setSubmitting(false); }
    };

    const handleStatusChange = async (id, status) => {
      try {
        const { data } = await updateInvoiceStatus(id, status);
        setInvoices(p => p.map(i => i._id === id ? data : i));
      } catch { setError('Failed to update status'); }
    };

    const handlePayEerc = async (id) => {
      setSimulatingId(id);
      setError('');
      try {
        const { data } = await api.patch(`/invoices/${id}/pay-eerc`);
        setInvoices(p => p.map(i => i._id === id ? data : i));
      } catch (err) {
        const msg = err.response?.data?.error || err.response?.data?.message || 'eERC payment failed';
        const insufficientMatch = msg.match(/Insufficient balance\. Have: ([\d.]+), Need: ([\d.]+)/);
        if (insufficientMatch) {
          setError(
            `Not enough encrypted balance to pay this invoice. Wallet has ${insufficientMatch[1]}, needs ${insufficientMatch[2]}. Top up via "npm run converter:deposit" and try again.`
          );
        } else {
          setError(msg);
        }
      } finally {
        setSimulatingId(null);
      }
    };

    const handleDelete = async (id) => {
      if (!confirm('Delete this invoice?')) return;
      try {
        await deleteInvoice(id);
        setInvoices(p => p.filter(i => i._id !== id));
      } catch { setError('Failed to delete invoice'); }
    };

    const handleSendReminder = async (inv) => {
      if (inv.status === 'paid') return;
      setReminderBusy(inv._id);
      setError('');
      try {
        const { data } = await evaluateReminderForInvoice(inv._id, { language: 'English' });
        if (data.message) {
          try {
            await navigator.clipboard.writeText(data.message);
          } catch { /* ignore */ }
          window.alert(`Decision: ${data.decision}\n\nMessage copied to clipboard.`);
        } else {
          window.alert(`Decision: ${data.decision}\n${data.reason || 'No message generated.'}`);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Reminder evaluation failed');
      } finally {
        setReminderBusy(null);
      }
    };

    const { subtotal, gstAmount, total } = calcTotals(form.items, form.gstPercent);

    const inputCls =
      'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500';

    const btnSecondary =
      'rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        {qrInvoice && <QRModal invoice={qrInvoice} onClose={() => setQrInvoice(null)} />}
        <InvoiceDetailModal invoice={viewInv} onClose={() => setViewInv(null)} />

        <PageHeader
          eyebrow="Billing"
          description={`${invoices.length} invoices on file — card view with quick actions.`}
          actions={
            <>
              <button
                type="button"
                onClick={voiceState === 'listening' ? stopVoice : startVoiceInput}
                title="Voice input"
                className={`rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
                  voiceState === 'listening'
                    ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                    : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300'
                }`}
              >
                {voiceState === 'listening' ? 'Stop voice' : 'Voice'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm((v) => !v);
                  if (showForm) stopVoice();
                }}
                className="rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md dark:from-cyan-600 dark:to-blue-600"
              >
                {showForm ? 'Close form' : 'New invoice'}
              </button>
            </>
          }
        />

        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6">
            <BizCard
              title="New invoice"
              subtitle="Use Voice to pre-fill fields when supported."
              actions={<span className="text-[10px] font-semibold uppercase tracking-wide text-biz-muted">Draft</span>}
            >
            {voiceState !== 'idle' && voiceHint && (
              <div
                className={`mb-4 rounded border px-3 py-2 text-xs ${
                  voiceState === 'listening'
                    ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30'
                    : voiceState === 'parsing'
                      ? 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30'
                      : voiceState === 'done'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30'
                }`}
              >
                {voiceHint}
              </div>
            )}

            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Customer *</label>
                <select value={form.customerId} onChange={(e) => setField('customerId', e.target.value)} required className={inputCls}>
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.businessName ? ` (${c.businessName})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">GST %</label>
                <input type="number" min="0" max="100" value={form.gstPercent} onChange={(e) => setField('gstPercent', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Due date *</label>
                <input type="date" value={form.dueDate} onChange={(e) => setField('dueDate', e.target.value)} required className={inputCls} />
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Line items</label>
                <button type="button" onClick={addItem} className="text-xs font-medium text-blue-700 dark:text-blue-400">
                  + Add line
                </button>
              </div>
              <div className="space-y-2">
                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 items-center gap-2">
                    <input
                      placeholder="Description"
                      value={item.name}
                      onChange={(e) => setItem(idx, 'name', e.target.value)}
                      required
                      className={`col-span-12 sm:col-span-6 ${inputCls}`}
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(e) => setItem(idx, 'qty', e.target.value)}
                      required
                      className={`col-span-4 sm:col-span-2 ${inputCls}`}
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Rate ₹"
                      value={item.rate}
                      onChange={(e) => setItem(idx, 'rate', e.target.value)}
                      required
                      className={`col-span-6 sm:col-span-3 ${inputCls}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length === 1}
                      className="col-span-2 flex items-center justify-center text-slate-400 hover:text-red-600 disabled:opacity-30 sm:col-span-1"
                      aria-label="Remove line item"
                    >
                      <IoClose className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 space-y-1 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-right text-xs dark:border-slate-700 dark:bg-slate-800/50">
              <div className="text-slate-600 dark:text-slate-400">
                Subtotal <span className="font-medium text-slate-900 dark:text-slate-100">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                GST ({form.gstPercent}%) <span className="font-medium text-slate-900 dark:text-slate-100">₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total ₹{total.toLocaleString('en-IN')}</div>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600"
              >
                {submitting ? 'Creating…' : 'Create invoice'}
              </button>
            </div>
            </BizCard>
          </form>
        )}

        <BizCard className="mb-5" title="Filters" subtitle="Search, status, customer, date range">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <input
              type="search"
              placeholder="Search invoice # or customer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`lg:col-span-2 ${inputCls}`}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
              <option value="all">All statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="due_soon">Due soon</option>
              <option value="overdue">Overdue</option>
            </select>
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className={inputCls}>
              <option value="">All customers</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} aria-label="From date" />
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} aria-label="To date" />
          </div>
        </BizCard>

        <BizCard title={`Invoices · ${filtered.length} shown`} subtitle="Each card is a bill — actions wrap on small screens">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No invoices match the current filters.</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((inv) => {
                const ui = deriveUiStatus(inv);
                return (
                  <div
                    key={inv._id}
                    className="flex flex-col rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-md ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:from-slate-900 dark:to-biz-slate dark:ring-slate-700"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{inv.invoiceNumber}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${ui.cls}`}>{ui.label}</span>
                    </div>
                    <p className="mt-2 truncate text-base font-bold text-slate-900 dark:text-white">{inv.customerId?.name || '—'}</p>
                    {inv.customerId?.businessName && (
                      <p className="truncate text-xs text-slate-500">{inv.customerId.businessName}</p>
                    )}
                    {inv.riskLevel && (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{inv.riskLevel} risk</p>
                    )}
                    {inv.paymentType === 'eerc' && inv.paymentTxHash && (
                      <a
                        href={`https://testnet.snowtrace.io/tx/${inv.paymentTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex w-fit items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-800 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
                        title={inv.paymentTxHash}
                      >
                        🔒 Paid privately via eERC · {inv.paymentTxHash.slice(0, 8)}…
                      </a>
                    )}
                    <p className="mt-3 text-2xl font-bold tabular-nums text-biz-navy dark:text-white">
                      ₹{inv.total?.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <button type="button" onClick={() => setViewInv(inv)} className={btnSecondary}>
                        View
                      </button>
                      <button type="button" onClick={() => setQrInvoice(inv)} className={`${btnSecondary} hidden sm:inline-flex`}>
                        UPI
                      </button>
                      <button type="button" onClick={() => generatePDF(inv)} className={btnSecondary}>
                        PDF
                      </button>
                      {inv.status !== 'paid' && (
                        <button
                          type="button"
                          disabled={reminderBusy === inv._id}
                          onClick={() => handleSendReminder(inv)}
                          className={`${btnSecondary} border-blue-200 text-blue-800 dark:border-blue-800 dark:text-blue-300`}
                        >
                          {reminderBusy === inv._id ? '…' : 'Remind'}
                        </button>
                      )}
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white py-1 pl-2 pr-6 text-xs dark:border-slate-600 dark:bg-slate-900"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      {inv.status !== 'paid' && (
                        <button
                          type="button"
                          disabled={simulatingId === inv._id}
                          onClick={() => handlePayEerc(inv._id)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                        >
                          {simulatingId === inv._id ? 'Processing…' : 'Pay via eERC'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(inv._id)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BizCard>
      </main>
    );
  }
