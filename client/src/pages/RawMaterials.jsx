import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  getRawMaterials, createRawMaterial,
  getSupplierStats, getMaterialAnalytics,
  getGSTSummary, getMonthlySpend,
} from '../services/api';
import BizCard from '../components/ui/BizCard';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import { HiOutlineBanknotes, HiOutlineCalculator, HiOutlineReceiptPercent, HiOutlineBuildingStorefront } from 'react-icons/hi2';

const EMPTY_FORM = {
  materialName: '',
  supplierName: '',
  quantity: '',
  pricePerUnit: '',
  gstPercent: '18',
  purchaseDate: '',
};

const GST_OPTIONS = [0, 5, 12, 18, 28];

const fmt = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RawMaterials() {
  const [materials,    setMaterials]    = useState([]);
  const [suppliers,    setSuppliers]    = useState([]);
  const [matAnalytics, setMatAnalytics] = useState([]);
  const [gstSummary,   setGstSummary]   = useState(null);
  const [monthly,      setMonthly]      = useState([]);

  const [form,      setForm]      = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error,     setError]     = useState('');
  const [preview,   setPreview]   = useState(null);

  // Live GST preview
  useEffect(() => {
    const qty = parseFloat(form.quantity);
    const ppu = parseFloat(form.pricePerUnit);
    const gst = parseFloat(form.gstPercent);
    if (!qty || !ppu || isNaN(gst)) { setPreview(null); return; }
    const base  = qty * ppu;
    const gstAmt = (base * gst) / 100;
    setPreview({ base, gstAmt, final: base + gstAmt, cgst: gstAmt / 2, sgst: gstAmt / 2 });
  }, [form.quantity, form.pricePerUnit, form.gstPercent]);

  const loadAll = async () => {
    const [matRes, supRes, anaRes, gstRes, monRes] = await Promise.allSettled([
      getRawMaterials(),
      getSupplierStats(),
      getMaterialAnalytics(),
      getGSTSummary(),
      getMonthlySpend(),
    ]);
    if (matRes.status === 'fulfilled') setMaterials(matRes.value.data);
    if (supRes.status === 'fulfilled') setSuppliers(supRes.value.data);
    if (anaRes.status === 'fulfilled') setMatAnalytics(anaRes.value.data);
    if (gstRes.status === 'fulfilled') setGstSummary(gstRes.value.data);
    if (monRes.status === 'fulfilled') setMonthly(monRes.value.data);
  };

  useEffect(() => { loadAll(); }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.materialName || !form.supplierName || !form.quantity || !form.pricePerUnit) {
      setError('All fields except date are required.');
      return;
    }
    setSubmitting(true);
    try {
      await createRawMaterial({
        ...form,
        quantity:     parseFloat(form.quantity),
        pricePerUnit: parseFloat(form.pricePerUnit),
        gstPercent:   parseFloat(form.gstPercent),
      });
      setForm(EMPTY_FORM);
      setPreview(null);
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Insights
  const topMaterial = matAnalytics[0]?.materialName || '—';
  const topSupplier = suppliers[0]?.supplierName    || '—';

  const inputCls =
    'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500';

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Procurement"
        description="Purchases, GST splits, and supplier analytics in card tiles."
      />

      {gstSummary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total spend"
            value={fmt(gstSummary.totalFinal)}
            sub={`${gstSummary.totalRecords} purchases`}
            icon={HiOutlineBanknotes}
            accent="default"
          />
          <StatCard label="Base cost" value={fmt(gstSummary.totalBase)} icon={HiOutlineCalculator} accent="violet" />
          <StatCard label="Total GST" value={fmt(gstSummary.totalGST)} icon={HiOutlineReceiptPercent} accent="warning" />
          <StatCard
            label="Suppliers"
            value={String(suppliers.length)}
            sub="unique"
            icon={HiOutlineBuildingStorefront}
            accent="success"
          />
        </div>
      )}

      {(matAnalytics.length > 0 || suppliers.length > 0) && (
        <BizCard title="Signals" subtitle="Quick read on spend concentration" hover={false}>
          <div className="flex flex-col gap-2 text-sm text-slate-700 dark:text-slate-300 sm:flex-row sm:gap-8">
            <p>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Top spend:</span> {topMaterial}
            </p>
            <p>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Frequent supplier:</span> {topSupplier}
              {suppliers[0] ? ` (${suppliers[0].transactions} orders)` : ''}
            </p>
          </div>
        </BizCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <BizCard className="lg:col-span-2" title="Record purchase" subtitle="GST preview updates live">
          <form onSubmit={handleSubmit} className="space-y-3">
            {[
              { name: 'materialName', label: 'Material Name',    type: 'text' },
              { name: 'supplierName', label: 'Supplier Name',    type: 'text' },
              { name: 'quantity',     label: 'Quantity',         type: 'number' },
              { name: 'pricePerUnit', label: 'Price per Unit (₹)', type: 'number' },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  min={type === 'number' ? '0' : undefined}
                  step={type === 'number' ? 'any' : undefined}
                  className={inputCls}
                  placeholder={label}
                />
              </div>
            ))}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">GST %</label>
              <select name="gstPercent" value={form.gstPercent} onChange={handleChange} className={inputCls}>
                {GST_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}%
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Purchase date (optional)</label>
              <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className={inputCls} />
            </div>

            {preview && (
              <div className="space-y-1 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Base</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{fmt(preview.base)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST ({form.gstPercent / 2}%)</span>
                  <span>{fmt(preview.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST ({form.gstPercent / 2}%)</span>
                  <span>{fmt(preview.sgst)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900 dark:border-slate-600 dark:text-slate-100">
                  <span>Final</span>
                  <span>{fmt(preview.final)}</span>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600"
            >
              {submitting ? 'Saving…' : 'Record purchase'}
            </button>
          </form>
        </BizCard>

        <BizCard className="lg:col-span-3" title="Purchase history" subtitle="Each lot as a card">
          {materials.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">No purchases recorded yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {materials.map((m) => (
                <div
                  key={m._id}
                  className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-md ring-1 ring-slate-200/60 dark:border-slate-700 dark:from-slate-900 dark:to-biz-slate dark:ring-slate-700"
                >
                  <p className="font-bold text-slate-900 dark:text-white">{m.materialName}</p>
                  <p className="text-xs text-slate-500">{m.supplierName}</p>
                  <div className="mt-3 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Qty</p>
                      <p className="text-lg font-bold tabular-nums">{m.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">GST</p>
                      <p className="font-semibold">{m.gstPercent}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Final</p>
                      <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(m.finalCost)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </BizCard>
      </div>

      {(matAnalytics.length > 0 || suppliers.length > 0 || monthly.length > 0) && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {matAnalytics.length > 0 && (
            <BizCard title="Top materials by spend" hover={false}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={matAnalytics.slice(0, 6)} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="materialName" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v), 'Spend']} />
                  <Bar dataKey="totalSpend" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BizCard>
          )}

          {suppliers.length > 0 && (
            <BizCard title="Supplier frequency" hover={false}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={suppliers.slice(0, 6)} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="supplierName" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [v, 'Orders']} />
                  <Bar dataKey="transactions" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </BizCard>
          )}

          {monthly.length > 0 && (
            <BizCard title="Monthly spend" hover={false}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthly} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [fmt(v), 'Spend']} />
                  <Line type="monotone" dataKey="totalSpend" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </BizCard>
          )}
        </div>
      )}
    </main>
  );
}
