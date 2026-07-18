import { useEffect, useMemo, useState } from 'react';
import { HiEllipsisHorizontal } from 'react-icons/hi2';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getCustomers, createCustomer, deleteCustomer, getCustomerHealth, getInvoices } from '../services/api';
import BizCard from '../components/ui/BizCard';
import PageHeader from '../components/ui/PageHeader';

const emptyForm = { name: '', phone: '', email: '', businessName: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [healthScores, setHealthScores] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getCustomers(), getInvoices()])
      .then(([{ data: custs }, { data: inv }]) => {
        setCustomers(custs);
        setInvoices(inv);
        custs.forEach((c) => {
          getCustomerHealth(c._id)
            .then(({ data: h }) => setHealthScores((prev) => ({ ...prev, [c._id]: h })))
            .catch(() => {});
        });
      })
      .catch(() => setError('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    return customers.map((c) => {
      const custInv = invoices.filter((i) => (i.customerId?._id || i.customerId) === c._id);
      const unpaid = custInv.filter((i) => i.status !== 'paid');
      const totalDue = unpaid.reduce((s, i) => s + (i.total || 0), 0);
      const paidInv = custInv.filter((i) => i.status === 'paid');
      const lastPaid = paidInv.length
        ? new Date(
            Math.max(...paidInv.map((i) => new Date(i.updatedAt || i.createdAt).getTime()))
          ).toLocaleDateString('en-IN')
        : '—';
      const h = healthScores[c._id];
      return { customer: c, totalDue, lastPaid, health: h };
    });
  }, [customers, invoices, healthScores]);

  const chartData = useMemo(() => {
    return [...rows]
      .filter((r) => r.totalDue > 0)
      .sort((a, b) => b.totalDue - a.totalDue)
      .slice(0, 5)
      .map((r) => ({
        name: r.customer.name.length > 14 ? `${r.customer.name.slice(0, 12)}…` : r.customer.name,
        unpaid: r.totalDue,
      }));
  }, [rows]);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await createCustomer(form);
      setCustomers((p) => [data, ...p]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setCustomers((p) => p.filter((c) => c._id !== id));
    } catch {
      setError('Failed to delete customer');
    }
  };

  const healthBadge = (color) => {
    if (color === 'green')
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
    if (color === 'yellow') return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
    return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
  };

  const inputCls =
    'w-full rounded border border-slate-200 bg-white px-3 py-2 text-sm focus:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-blue-500';

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Accounts"
        description={`${customers.length} customers on file — health scores refresh as invoices change.`}
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-biz-accent/20 dark:from-cyan-600 dark:to-blue-600"
          >
            {showForm ? 'Close form' : 'Add customer'}
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6">
          <BizCard title="New customer" subtitle="Name is required; other fields help reminders and health.">
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { name: 'name', label: 'Full name *', placeholder: 'Ramesh Kumar' },
              { name: 'businessName', label: 'Business name', placeholder: 'Ramesh Kirana' },
              { name: 'phone', label: 'Phone', placeholder: '9876543210' },
              { name: 'email', label: 'Email', placeholder: 'ramesh@example.com' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">{label}</label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required={name === 'name'}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-biz-accent to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-md disabled:opacity-50 dark:from-cyan-600 dark:to-blue-600"
            >
              {submitting ? 'Saving…' : 'Save'}
            </button>
          </div>
          </BizCard>
        </form>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BizCard title="Customer roster" subtitle="Cards sort exposure at a glance">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
          ) : customers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">No customers yet.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map(({ customer: c, totalDue, lastPaid, health }) => (
                <div
                  key={c._id}
                  className="flex flex-col rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-md ring-1 ring-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:from-slate-900 dark:to-biz-slate dark:ring-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-white">{c.name}</p>
                      {c.businessName && <p className="truncate text-xs text-slate-500">{c.businessName}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(c._id)}
                      className="shrink-0 text-xs font-semibold text-slate-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="mt-3 text-2xl font-bold tabular-nums text-biz-navy dark:text-white">
                    ₹{totalDue.toLocaleString('en-IN')}
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">due</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Last paid: {lastPaid}</p>
                  <div className="mt-3">
                    {health ? (
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${healthBadge(health.color)}`}
                        title={`Payment rate ${health.breakdown?.paymentRate ?? '—'}%`}
                      >
                        {health.score} · {health.label}
                      </span>
                    ) : (
                      <HiEllipsisHorizontal className="inline h-5 w-5 text-slate-400" aria-label="Loading health" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          </BizCard>
        </div>

        <BizCard title="Top unpaid balances" subtitle="By amount outstanding">
            {chartData.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">No unpaid balances</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={88} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Unpaid']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="unpaid" fill="#1e40af" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </BizCard>
      </div>
    </main>
  );
}
