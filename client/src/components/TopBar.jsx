import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { getUnreadCount, getNotifications, markAllRead, markNotificationRead } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import DemoTour from './DemoTour';

const ROUTE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview and key metrics' },
  '/invoices': { title: 'Invoices', subtitle: 'Billing and collections' },
  '/customers': { title: 'Customers', subtitle: 'Accounts and health' },
  '/reminders': { title: 'Reminders & automation', subtitle: 'AI-assisted follow-up' },
  '/analytics': { title: 'Analytics', subtitle: 'Performance and trends' },
  '/raw-materials': { title: 'Raw materials', subtitle: 'Purchases and GST' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock and suppliers' },
  '/notifications': { title: 'Notifications', subtitle: 'Activity log' },
  '/settings': { title: 'Settings', subtitle: 'Account and preferences' },
};

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

function BellMenu({ onClose }) {
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
      className="absolute right-0 top-full mt-1.5 w-[min(100vw-2rem,22rem)] rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-900 z-50 overflow-hidden"
      role="menu"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-700">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          Notifications
        </span>
        <button
          type="button"
          onClick={handleMarkAll}
          className="text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 active:scale-[0.98]"
        >
          Mark all read
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="space-y-0 divide-y divide-slate-100 dark:divide-slate-800">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse bg-slate-50 dark:bg-slate-800/50" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">No notifications</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.invoice_created;
              return (
                <li key={n._id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n._id)}
                    className={`flex w-full gap-2 border-l-4 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 ${meta.border} ${
                      n.read ? 'opacity-70' : 'bg-slate-50/80 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                        {n.message}
                      </p>
                    </div>
                    <time className="shrink-0 text-[10px] text-slate-400 tabular-nums">{timeAgo(n.createdAt)}</time>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-700">
        <Link
          to="/notifications"
          onClick={onClose}
          className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-400"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const meta = ROUTE_TITLES[pathname] || { title: 'Smart Invoicing', subtitle: '' };
  const [bellOpen, setBellOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tourStep, setTourStep] = useState(null);
  const bellRef = useRef(null);

  useEffect(() => {
    const fetch = () => getUnreadCount().then(({ data }) => setUnread(data.count || 0)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  return (
    <>
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900 md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] lg:hidden dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{meta.title}</h1>
        {meta.subtitle && (
          <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:block">{meta.subtitle}</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => setTourStep(0)}
        className="hidden rounded border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] sm:inline dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        title="Hackathon demo walkthrough"
      >
        Demo tour
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="rounded border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? 'Light' : 'Dark'}
      </button>

      <div ref={bellRef} className="relative">
        <button
          type="button"
          onClick={() => setBellOpen((v) => !v)}
          className="relative rounded border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 active:scale-[0.98] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-expanded={bellOpen}
          aria-haspopup="true"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
        {bellOpen && <BellMenu onClose={() => setBellOpen(false)} />}
      </div>
    </header>

    {tourStep !== null && (
      <DemoTour
        step={tourStep}
        onNext={() => setTourStep((s) => Math.min(s + 1, 3))}
        onPrev={() => setTourStep((s) => Math.max(0, s - 1))}
        onClose={() => setTourStep(null)}
      />
    )}
    </>
  );
}
