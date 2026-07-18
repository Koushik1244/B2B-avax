import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Overview, cash flow, and AI insights' },
  '/invoices': { title: 'Invoices', subtitle: 'Billing, UPI, PDFs, and collections' },
  '/customers': { title: 'Customers', subtitle: 'Accounts, exposure, and health scores' },
  '/reminders': { title: 'Reminders', subtitle: 'AI-assisted follow-up queue' },
  '/analytics': { title: 'Analytics', subtitle: 'Revenue, mix, and trends' },
  '/raw-materials': { title: 'Raw materials', subtitle: 'Purchases, GST, and spend' },
  '/inventory': { title: 'Inventory', subtitle: 'Stock levels and suppliers' },
  '/notifications': { title: 'Notifications', subtitle: 'Activity and system events' },
  '/settings': { title: 'Settings', subtitle: 'Account and preferences' },
};

export default function PageRibbon() {
  const { pathname } = useLocation();
  const meta = ROUTE_TITLES[pathname] || { title: 'AutoBiz', subtitle: 'Smart invoicing assistant' };

  return (
    <div className="border-b border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-biz-slate/90 sm:px-4 sm:py-4 md:px-6">
      <div className="mx-auto max-w-[1600px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-biz-muted dark:text-slate-400 sm:text-[11px] sm:tracking-[0.18em]">
          {pathname === '/dashboard' ? 'Command center' : 'Workspace'}
        </p>
        <h1 className="mt-1 text-lg font-bold tracking-tight text-biz-navy dark:text-white sm:text-xl md:text-2xl">
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className="mt-1 max-w-2xl text-pretty text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
            {meta.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
