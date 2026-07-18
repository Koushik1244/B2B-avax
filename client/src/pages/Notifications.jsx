import { useEffect, useState } from 'react';
import { getNotifications, markNotificationRead, markAllRead } from '../services/api';
import BizCard from '../components/ui/BizCard';
import PageHeader from '../components/ui/PageHeader';

const TYPE_LABEL = {
  invoice_created: 'Invoice',
  reminder_sent: 'Reminder',
  escalation: 'Escalation',
  payment_received: 'Payment',
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getNotifications()
      .then(({ data }) => setNotifications(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    await markNotificationRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'high') return n.priority === 'high';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <PageHeader
        eyebrow="Inbox"
        description={unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up'}
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={handleMarkAll}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
          { key: 'high', label: 'High priority' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold transition active:scale-[0.98] ${
              filter === key
                ? 'border-transparent bg-gradient-to-r from-biz-accent to-blue-600 text-white shadow-md dark:from-cyan-600 dark:to-blue-600'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <BizCard title="Activity feed" subtitle="Unread items have a glow accent">
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No notifications in this view.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((n) => (
              <div
                key={n._id}
                className={`rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
                  !n.read
                    ? 'border-l-4 border-l-biz-accent border-slate-200 bg-sky-50/50 dark:border-slate-700 dark:border-l-cyan-500 dark:bg-slate-800/60'
                    : 'border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-biz-muted shadow-sm dark:bg-slate-800 dark:text-slate-400">
                      {TYPE_LABEL[n.type] || n.type}
                    </span>
                    <time className="text-[11px] tabular-nums text-slate-400">{timeAgo(n.createdAt)}</time>
                    {n.priority === 'high' && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-800 dark:bg-red-950 dark:text-red-300">
                        High
                      </span>
                    )}
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      className="text-xs font-bold text-biz-accent hover:underline dark:text-cyan-400"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{n.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </BizCard>
    </main>
  );
}
