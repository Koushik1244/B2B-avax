import { useEffect, useRef, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaStar } from 'react-icons/fa';
import {
  getInventory, createInventory, updateInventory, deleteInventory,
  getSuppliers, createSupplier, deleteSupplier,
  scanBill,
} from '../services/api';
import BizCard from '../components/ui/BizCard';
import PageHeader from '../components/ui/PageHeader';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

// ─── OCR Result Panel ─────────────────────────────────────────────────────────

function OcrPanel({ result, onClose }) {
  if (!result) return null;
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111] border border-[#2a2a2a] rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">OCR Result</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-white/10" aria-label="Close">
            <IoClose className="h-5 w-5" />
          </button>
        </div>

        {result.total > 0 && (
          <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-gray-500 mb-0.5">Detected Total</p>
            <p className="text-2xl font-bold text-emerald-400">₹{fmt(result.total)}</p>
          </div>
        )}

        {result.items && result.items.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Extracted Lines ({result.items.length})</p>
            <div className="space-y-1">
              {result.items.map((item, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-lg px-3 py-2 text-xs text-gray-300 font-mono">
                  {item.name
                    ? <span><span className="text-white">{item.name}</span> · qty {item.qty} · ₹{item.rate}</span>
                    : item.raw}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="text-xs text-gray-600 mb-2">Raw Text</p>
          <pre className="bg-[#0d0d0d] border border-[#2a2a2a] rounded-xl p-3 text-[10px] text-gray-500 whitespace-pre-wrap overflow-x-auto max-h-40">
            {result.rawText}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_INV = { productName: '', quantity: '', threshold: '', supplierIds: [] };
const EMPTY_SUP = { name: '', email: '', priceIndex: '5', avgDeliveryDays: '3', rating: '4' };

export default function Inventory() {
  const [items,     setItems]     = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Inventory form
  const [invForm,    setInvForm]    = useState(EMPTY_INV);
  const [invErr,     setInvErr]     = useState('');
  const [invLoading, setInvLoading] = useState(false);

  // Supplier form
  const [supForm,    setSupForm]    = useState(EMPTY_SUP);
  const [supErr,     setSupErr]     = useState('');
  const [supLoading, setSupLoading] = useState(false);
  const [showSupForm, setShowSupForm] = useState(false);

  // Edit quantity inline
  const [editingId, setEditingId]  = useState(null);
  const [editQty,   setEditQty]    = useState('');

  // OCR
  const fileRef               = useRef(null);
  const [scanning, setScanning]   = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const load = async () => {
    const [invRes, supRes] = await Promise.allSettled([getInventory(), getSuppliers()]);
    if (invRes.status === 'fulfilled') setItems(invRes.value.data);
    if (supRes.status === 'fulfilled') setSuppliers(supRes.value.data);
  };

  useEffect(() => { load(); }, []);

  // ── Inventory CRUD ───────────────────────────────────────────────────────────

  const handleInvChange = (e) => {
    const { name, value, options, multiple } = e.target;
    if (multiple) {
      const selected = Array.from(options).filter(o => o.selected).map(o => o.value);
      setInvForm(p => ({ ...p, supplierIds: selected }));
    } else {
      setInvForm(p => ({ ...p, [name]: value }));
    }
  };

  const handleInvSubmit = async (e) => {
    e.preventDefault();
    setInvErr('');
    if (!invForm.productName) { setInvErr('Product name is required.'); return; }
    setInvLoading(true);
    try {
      await createInventory({
        productName: invForm.productName,
        quantity:    Number(invForm.quantity)  || 0,
        threshold:   Number(invForm.threshold) || 10,
        supplierIds: invForm.supplierIds,
      });
      setInvForm(EMPTY_INV);
      await load();
    } catch (err) {
      setInvErr(err.response?.data?.message || 'Failed to save.');
    } finally {
      setInvLoading(false);
    }
  };

  const saveQty = async (id) => {
    try {
      await updateInventory(id, { quantity: Number(editQty) });
      setEditingId(null);
      await load();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this item?')) return;
    await deleteInventory(id).catch(() => {});
    setItems(prev => prev.filter(i => i._id !== id));
  };

  // ── Supplier CRUD ────────────────────────────────────────────────────────────

  const handleSupChange = (e) => setSupForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSupSubmit = async (e) => {
    e.preventDefault();
    setSupErr('');
    if (!supForm.name || !supForm.email) { setSupErr('Name and email are required.'); return; }
    setSupLoading(true);
    try {
      await createSupplier({
        name:            supForm.name,
        email:           supForm.email,
        priceIndex:      Number(supForm.priceIndex),
        avgDeliveryDays: Number(supForm.avgDeliveryDays),
        rating:          Number(supForm.rating),
      });
      setSupForm(EMPTY_SUP);
      setShowSupForm(false);
      await load();
    } catch (err) {
      setSupErr(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSupLoading(false);
    }
  };

  const handleSupDelete = async (id) => {
    await deleteSupplier(id).catch(() => {});
    setSuppliers(prev => prev.filter(s => s._id !== id));
  };

  // ── OCR ──────────────────────────────────────────────────────────────────────

  const handleScanBill = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await scanBill(fd);
      setOcrResult(data);
    } catch (err) {
      alert(err.response?.data?.message || 'OCR scan failed.');
    } finally {
      setScanning(false);
      e.target.value = '';
    }
  };

  const lowCount = items.filter(i => i.quantity < i.threshold).length;

  const inputCls =
    'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500';

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Stock"
        description={`${items.length} SKUs${lowCount > 0 ? ` · ${lowCount} below reorder` : ''}`}
        actions={
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleScanBill} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={scanning}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {scanning ? 'Scanning…' : 'Scan bill (OCR)'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <BizCard className="lg:col-span-2" title="Add product" subtitle="Link suppliers for replenishment">
          <form onSubmit={handleInvSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Product name</label>
              <input
                name="productName"
                value={invForm.productName}
                onChange={handleInvChange}
                className={inputCls}
                placeholder="e.g. Steel rods"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Stock</label>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  value={invForm.quantity}
                  onChange={handleInvChange}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Reorder level</label>
                <input
                  name="threshold"
                  type="number"
                  min="0"
                  value={invForm.threshold}
                  onChange={handleInvChange}
                  className={inputCls}
                  placeholder="10"
                />
              </div>
            </div>

            {suppliers.length > 0 && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Suppliers (Ctrl/Cmd multi-select)
                </label>
                <select
                  multiple
                  value={invForm.supplierIds}
                  onChange={handleInvChange}
                  name="supplierIds"
                  className={`${inputCls} h-24`}
                >
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {invErr && <p className="text-xs text-red-600 dark:text-red-400">{invErr}</p>}
            <button
              type="submit"
              disabled={invLoading}
              className="w-full rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600"
            >
              {invLoading ? 'Adding…' : 'Add product'}
            </button>
          </form>
        </BizCard>

        <BizCard className="lg:col-span-3" title="Stock on hand" subtitle="Low stock cards use a red accent">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No products yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item) => {
                const low = item.quantity < item.threshold;
                const sup = (item.supplierIds || []).map((s) => s.name).join(', ') || '—';
                return (
                  <div
                    key={item._id}
                    className={`rounded-xl border p-4 shadow-md ring-1 transition hover:shadow-lg ${
                      low
                        ? 'border-red-200 bg-red-50/50 ring-red-200/60 dark:border-red-900 dark:bg-red-950/20 dark:ring-red-900/40'
                        : 'border-slate-100 bg-gradient-to-br from-white to-slate-50/90 ring-slate-200/60 dark:border-slate-700 dark:from-slate-900 dark:to-biz-slate dark:ring-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {low && (
                          <span className="mb-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                            Low stock
                          </span>
                        )}
                        <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="mt-1 truncate text-xs text-slate-500" title={sup}>
                          {sup}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-slate-400">On hand</p>
                        {editingId === item._id ? (
                          <input
                            type="number"
                            min="0"
                            value={editQty}
                            onChange={(e) => setEditQty(e.target.value)}
                            className="mt-1 w-24 rounded-lg border border-slate-200 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900"
                          />
                        ) : (
                          <p className="text-xl font-bold tabular-nums">{fmt(item.quantity)}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-slate-400">Reorder at</p>
                        <p className="font-semibold tabular-nums text-slate-600 dark:text-slate-400">{item.threshold}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      {editingId === item._id ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveQty(item._id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold dark:border-slate-600"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(item._id);
                              setEditQty(String(item.quantity));
                            }}
                            className="text-xs font-bold text-biz-accent dark:text-cyan-400"
                          >
                            Adjust
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="text-xs font-semibold text-slate-400 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </BizCard>
      </div>

      <BizCard
        title="Suppliers"
        subtitle="Ratings and delivery expectations"
        actions={
          <button
            type="button"
            onClick={() => setShowSupForm((v) => !v)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-300"
          >
            {showSupForm ? 'Cancel' : 'Add supplier'}
          </button>
        }
      >
        {showSupForm && (
          <form
            onSubmit={handleSupSubmit}
            className="mb-5 grid grid-cols-2 gap-3 rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-3 lg:grid-cols-5"
          >
            {[
              { name: 'name',            label: 'Name',          type: 'text',   placeholder: 'Supplier Co.' },
              { name: 'email',           label: 'Email',         type: 'email',  placeholder: 'supplier@co.com' },
              { name: 'priceIndex',      label: 'Price Index',   type: 'number', placeholder: '5' },
              { name: 'avgDeliveryDays', label: 'Delivery Days', type: 'number', placeholder: '3' },
              { name: 'rating',          label: 'Rating (1-5)',  type: 'number', placeholder: '4' },
            ].map((f) => (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{f.label}</label>
                <input
                  name={f.name}
                  type={f.type}
                  value={supForm[f.name]}
                  onChange={handleSupChange}
                  placeholder={f.placeholder}
                  min={f.type === 'number' ? '0' : undefined}
                  step={f.type === 'number' ? 'any' : undefined}
                  className={inputCls}
                />
              </div>
            ))}
            <div className="col-span-full flex items-center gap-3">
              {supErr && <p className="flex-1 text-xs text-red-600 dark:text-red-400">{supErr}</p>}
              <button
                type="submit"
                disabled={supLoading}
                className="ml-auto rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600"
              >
                {supLoading ? 'Saving…' : 'Add supplier'}
              </button>
            </div>
          </form>
        )}

        {suppliers.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">No suppliers yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {suppliers.map((s) => {
              const score = ((s.priceIndex * 0.5) + (s.avgDeliveryDays * 0.3) - (s.rating * 0.2)).toFixed(2);
              return (
                <div
                  key={s._id}
                  className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm ring-1 ring-slate-200/60 dark:border-slate-700 dark:bg-slate-800/40 dark:ring-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSupDelete(s._id)}
                      className="text-xs font-semibold text-slate-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="rounded-lg bg-white px-2 py-1 font-semibold shadow-sm dark:bg-slate-900">
                      Price idx {s.priceIndex}
                    </span>
                    <span className="rounded-lg bg-white px-2 py-1 font-semibold shadow-sm dark:bg-slate-900">
                      {s.avgDeliveryDays}d delivery
                    </span>
                    <span className="inline-flex items-center gap-0.5 rounded-lg bg-amber-50 px-2 py-1 dark:bg-amber-950/40">
                      {Array.from({ length: Math.round(s.rating) }).map((_, i) => (
                        <FaStar key={i} className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                      ))}
                    </span>
                    <span className="ml-auto font-mono font-bold text-biz-accent dark:text-cyan-400">Score {score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BizCard>

      <OcrPanel result={ocrResult} onClose={() => setOcrResult(null)} />
    </main>
  );
}
