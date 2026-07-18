import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  getInvoices,
  getInsights,
  setBusyMode as syncBusyMode,
  getCustomers,
  getCustomerHealth,
} from '../services/api';
import InsightIcon from '../components/InsightIcon';
import { Link } from 'react-router-dom';
import BizCard from '../components/ui/BizCard';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import {
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineExclamationTriangle,
} from 'react-icons/hi2';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-800">
      <p className="mb-0.5 text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-slate-100">
        ₹{Number(payload[0].value).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

const HealthTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-600 dark:bg-slate-800">
      <p className="font-semibold text-slate-900 dark:text-slate-100">{payload[0].payload.name}</p>
      <p className="text-slate-600 dark:text-slate-400">Health: {payload[0].value}</p>
    </div>
  );
};

export default function Dashboard() {
  const [invoices, setInvoices] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastRun] = useState(() => localStorage.getItem('lastReminderRun'));
  const [busyMode, setBusyMode] = useState(() => localStorage.getItem('busyMode') === 'true');
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [healthChartData, setHealthChartData] = useState([]);

  const toggleBusyMode = () => {
    const next = !busyMode;
    setBusyMode(next);
    localStorage.setItem('busyMode', String(next));
    syncBusyMode(next).catch(() => {});
  };

  useEffect(() => {
    getInvoices()
      .then(({ data }) => setInvoices(data))
      .finally(() => setLoading(false));

    getCustomers()
      .then(({ data }) => setCustomerCount(data?.length ?? 0))
      .catch(() => {});

    getInsights()
      .then(({ data }) => setInsights(data.insights || []))
      .catch(() => setInsights([]))
      .finally(() => setInsightsLoading(false));
  }, []);

  useEffect(() => {
    if (!invoices.length) {
      setHealthChartData([]);
      return;
    }
    const unpaidByCustomer = {};
    invoices.forEach((inv) => {
      if (inv.status === 'paid') return;
      const id = inv.customerId?._id || inv.customerId;
      const name = inv.customerId?.name || 'Unknown';
      if (!id) return;
      unpaidByCustomer[id] = unpaidByCustomer[id] || { name, total: 0 };
      unpaidByCustomer[id].total += inv.total || 0;
    });
    const top = Object.entries(unpaidByCustomer)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([cid, v]) => ({ id: cid, name: v.name, unpaid: v.total }));

    if (top.length === 0) {
      getCustomers().then(({ data: custs }) => {
        const slice = custs.slice(0, 5);
        Promise.all(
          slice.map((c) =>
            getCustomerHealth(c._id)
              .then(({ data: h }) => ({ name: c.name, score: h.score ?? 0 }))
              .catch(() => ({ name: c.name, score: 0 }))
          )
        ).then((rows) => setHealthChartData(rows));
      });
      return;
    }

    Promise.all(
      top.map(({ id, name }) =>
        getCustomerHealth(id)
          .then(({ data: h }) => ({ name, score: h.score ?? 0 }))
          .catch(() => ({ name, score: 0 }))
      )
    ).then(setHealthChartData);
  }, [invoices]);

  const pendingCount = invoices.filter((i) => i.status !== 'paid').length;
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  const chartData = (() => {
    const map = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      map[key] = 0;
    }
    invoices.forEach((inv) => {
      const key = new Date(inv.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (map[key] !== undefined) map[key] += inv.total;
    });
    return Object.entries(map).map(([date, amount]) => ({ date, amount }));
  })();

  const lastRunText = lastRun
    ? (() => {
        const mins = Math.floor((Date.now() - Number(lastRun)) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min ago`;
        return `${Math.floor(mins / 60)}h ago`;
      })()
    : 'Never';

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Operations"
        description="Automation status, cash signals, and AI nudges — tuned for busy shop floors."
        actions={
          <>
            <button
              type="button"
              onClick={toggleBusyMode}
              className={`rounded-xl border px-4 py-2 text-xs font-bold shadow-sm transition hover:scale-[1.02] active:scale-[0.98] ${
                busyMode
                  ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
                  : 'border-slate-200 bg-white text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              Busy mode: {busyMode ? 'On' : 'Off'}
            </button>
            <Link
              to="/reminders"
              className="rounded-xl border border-transparent bg-gradient-to-r from-biz-accent to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-biz-accent/25 transition hover:opacity-95 active:scale-[0.98] dark:from-cyan-600 dark:to-blue-600"
            >
              Run smart reminders
            </Link>
          </>
        }
      />

      <div
        className={`mb-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3 text-xs font-medium shadow-sm ${
          busyMode
            ? 'border-amber-200 bg-amber-50/90 text-amber-950 dark:border-amber-800 dark:bg-amber-950/25 dark:text-amber-100'
            : 'border-emerald-200 bg-emerald-50/90 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100'
        }`}
      >
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${busyMode ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
        <span>
          Automation {busyMode ? 'paused' : 'active'} · Last reminder run: {lastRunText}
        </span>
      </div>

      {busyMode && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-md dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-100">
          Reminders are suppressed while busy mode is enabled.
          <button type="button" onClick={toggleBusyMode} className="ml-2 font-bold underline decoration-2">
            Turn off
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800" />
          ))
        ) : (
          <>
            <StatCard
              label="Total invoices"
              value={String(invoices.length)}
              sub="All time"
              icon={HiOutlineDocumentText}
              accent="default"
            />
            <StatCard
              label="Customers"
              value={String(customerCount)}
              sub="On file"
              icon={HiOutlineUsers}
              accent="violet"
            />
            <StatCard
              label="Pending collection"
              value={String(pendingCount)}
              sub="Unpaid pipeline"
              icon={HiOutlineClock}
              accent="warning"
            />
            <StatCard
              label="Overdue"
              value={String(overdueCount)}
              sub="Needs attention"
              icon={HiOutlineExclamationTriangle}
              accent="danger"
            />
          </>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BizCard title="Payments trend" subtitle="Invoice amount booked per day · last 30 days">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </BizCard>

        <BizCard title="Customer health score" subtitle="Top accounts by exposure (0–100)">
          {healthChartData.length === 0 ? (
            <div className="flex h-[240px] items-center justify-center text-sm text-slate-500">No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={healthChartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<HealthTooltip />} />
                <Bar dataKey="score" fill="#64748b" radius={[0, 6, 6, 0]} className="dark:fill-slate-500" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </BizCard>
      </div>

      <BizCard
        className="mb-6"
        title="Business insights"
        subtitle="Gemini-generated focus areas"
        actions={
          <button
            type="button"
            onClick={() => {
              setInsightsLoading(true);
              getInsights()
                .then(({ data }) => setInsights(data.insights || []))
                .catch(() => setInsights([]))
                .finally(() => setInsightsLoading(false));
            }}
            className="rounded-lg text-xs font-bold text-biz-accent hover:underline dark:text-cyan-400"
          >
            Refresh
          </button>
        }
      >
        {insightsLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : insights.length === 0 ? (
          <p className="text-sm text-slate-500">Add invoices to generate insights.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {insights.map((insight, i) => {
              const icon = insight?.icon;
              const title = insight?.title || `Insight ${i + 1}`;
              const text = insight?.insight || (typeof insight === 'string' ? insight : '');
              return (
                <div
                  key={i}
                  className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm transition hover:border-biz-accent/30 hover:shadow-md dark:border-slate-800 dark:bg-slate-800/40"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow dark:bg-slate-900">
                    <InsightIcon value={icon} className="h-5 w-5 text-biz-accent dark:text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </BizCard>

      <BizCard
        title="Recent invoices"
        subtitle="Swipe on mobile — full register in Invoices"
        actions={
          <Link to="/invoices" className="text-xs font-bold text-biz-accent dark:text-cyan-400">
            View all
          </Link>
        }
      >
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : invoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <div className="-mx-1 flex gap-3 overflow-x-auto pb-2 pt-1 nav-scroll-hide">
            {invoices.slice(0, 10).map((inv) => (
              <div
                key={inv._id}
                className="w-[min(100%,260px)] shrink-0 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/90 p-4 shadow-md ring-1 ring-slate-200/60 dark:border-slate-700 dark:from-slate-900 dark:to-biz-slate dark:ring-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">{inv.invoiceNumber}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      inv.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : inv.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-bold text-slate-900 dark:text-white">
                  {inv.customerId?.name || '—'}
                </p>
                <p className="mt-2 text-2xl font-bold tabular-nums text-biz-navy dark:text-white">
                  ₹{inv.total?.toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Due {new Date(inv.dueDate).toLocaleDateString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        )}
      </BizCard>
    </main>
  );
}
