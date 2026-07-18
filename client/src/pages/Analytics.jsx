import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { getInvoices } from '../services/api';
import BizCard from '../components/ui/BizCard';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import { HiOutlineBanknotes, HiOutlineCheckCircle, HiOutlineChartPie, HiOutlineCalculator } from 'react-icons/hi2';

const PIE_COLORS = ['#15803d', '#b45309', '#b91c1c'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <p className="text-slate-500">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-semibold text-slate-900 dark:text-slate-100">
          {p.name}:{' '}
          {p.dataKey === 'revenue' || p.dataKey === 'amount'
            ? `₹${Number(p.value).toLocaleString('en-IN')}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoices()
      .then(({ data }) => setInvoices(data))
      .finally(() => setLoading(false));
  }, []);

  const monthlyData = (() => {
    const map = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      map[key] = { month: key, revenue: 0, count: 0 };
    }
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const key = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (map[key]) {
        map[key].revenue += inv.total;
        map[key].count += 1;
      }
    });
    return Object.values(map);
  })();

  const statusData = [
    { name: 'Paid', value: invoices.filter((i) => i.status === 'paid').length },
    { name: 'Unpaid', value: invoices.filter((i) => i.status === 'unpaid').length },
    { name: 'Overdue', value: invoices.filter((i) => i.status === 'overdue').length },
  ].filter((d) => d.value > 0);

  const customerTotals = invoices.reduce((acc, inv) => {
    const name = inv.customerId?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + inv.total;
    return acc;
  }, {});
  const topCustomers = Object.entries(customerTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, amount]) => ({ name, amount }));

  const runningData = (() => {
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
    let running = 0;
    return Object.entries(map).map(([date, amount]) => {
      running += amount;
      return { date, amount: running };
    });
  })();

  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const paidRevenue = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const collectionRate = totalRevenue > 0 ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  if (loading) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-6 md:px-6">
        <div className="grid h-28 animate-pulse grid-cols-2 gap-4 lg:grid-cols-4" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Performance"
        description="Recharts-powered revenue, status mix, and customer concentration."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total billed"
          value={`₹${totalRevenue.toLocaleString('en-IN')}`}
          sub="Lifetime invoice value"
          icon={HiOutlineBanknotes}
          accent="default"
        />
        <StatCard
          label="Collected"
          value={`₹${paidRevenue.toLocaleString('en-IN')}`}
          sub="Paid status"
          icon={HiOutlineCheckCircle}
          accent="success"
        />
        <StatCard label="Collection rate" value={`${collectionRate}%`} sub="Paid ÷ total" icon={HiOutlineChartPie} accent="violet" />
        <StatCard
          label="Avg invoice"
          value={invoices.length > 0 ? `₹${Math.round(totalRevenue / invoices.length).toLocaleString('en-IN')}` : '₹0'}
          sub="Mean ticket"
          icon={HiOutlineCalculator}
          accent="warning"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BizCard className="lg:col-span-2" title="Monthly revenue" subtitle="Last 6 months">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
        </BizCard>

        <BizCard title="Status mix" subtitle="By invoice count">
            {statusData.length === 0 ? (
              <p className="py-12 text-center text-sm text-slate-500">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="45%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % 3]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </BizCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <BizCard className="lg:col-span-2" title="Cumulative billing" subtitle="30-day running total">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={runningData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => `₹${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="amount" name="Cumulative" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
        </BizCard>

        <BizCard title="Top customers" subtitle="By revenue share">
            {topCustomers.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No data</p>
            ) : (
              topCustomers.map((c) => {
                const pct = Math.round((c.amount / topCustomers[0].amount) * 100);
                return (
                  <div key={c.name} className="py-2 first:pt-0 last:pb-0">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="truncate font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="ml-2 shrink-0 tabular-nums text-slate-600 dark:text-slate-400">
                        ₹{c.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-biz-accent to-blue-600 dark:from-cyan-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
        </BizCard>
      </div>
    </main>
  );
}
