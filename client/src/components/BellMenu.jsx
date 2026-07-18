import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications, markAllRead, markNotificationRead } from '../services/api';

const TYPE_META = {
  invoice_created: { label: 'Invoice', border: 'border-l-blue-600 dark:border-l-blue-500' },
  reminder_sent: { label: 'Reminder', border: 'border-l-amber-500' },
  escalation: { label: 'Escalation', border: 'border-l-red-500' },
  payment_received: { label: 'Payment', border: 'border-l-emerald-600 dark:border-l-emerald-500' },
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

export default function BellMenu({ onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotifications()
      .then(({ data }) => setItems(data.slice(0, 12)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {});
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClick = async (id) => {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
  };

  return (
    <div
      className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-biz dark:border-slate-600 dark:bg-slate-900 dark:shadow-biz-dark"
      role="menu"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Notifications
        </span>
        <button
          type="button"
          onClick={handleMarkAll}
          className="text-xs font-semibold text-biz-accent transition hover:text-biz-accentHover dark:text-cyan-400"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-[min(70vh,20rem)] overflow-y-auto overscroll-contain sm:max-h-80">
        {loading ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse bg-slate-50 dark:bg-slate-800/50" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No notifications</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.invoice_created;
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n._id)}
                    className={`flex w-full gap-2 border-l-4 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 ${meta.border} ${
                      n.read ? 'opacity-70' : 'bg-sky-50/60 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {n.message}
                      </p>
                    </div>
                    <time className="shrink-0 text-[10px] tabular-nums text-slate-400">{timeAgo(n.createdAt)}</time>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <Link to="/notifications" onClick={onClose} className="text-xs font-semibold text-biz-accent dark:text-cyan-400">
          View all notifications
        </Link>
      </div>
    </div>
  );
}
