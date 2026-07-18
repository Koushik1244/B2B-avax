import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineSquares2X2,
  HiOutlineDocumentText,
  HiOutlineUsers,
  HiOutlineBellAlert,
  HiOutlineChartBarSquare,
  HiOutlineCube,
  HiOutlineArchiveBox,
  HiOutlineBell,
  HiOutlineCog6Tooth,
  HiOutlineInformationCircle,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlinePlayCircle,
  HiOutlineBars3,
  HiOutlineXMark,
} from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getUnreadCount } from '../services/api';
import BellMenu from './BellMenu';
import DemoTour from './DemoTour';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', Icon: HiOutlineSquares2X2 },
  { to: '/invoices', label: 'Invoices', Icon: HiOutlineDocumentText },
  { to: '/customers', label: 'Customers', Icon: HiOutlineUsers },
  { to: '/reminders', label: 'Reminders', Icon: HiOutlineBellAlert },
  { to: '/analytics', label: 'Analytics', Icon: HiOutlineChartBarSquare },
  { to: '/raw-materials', label: 'Materials', Icon: HiOutlineCube },
  { to: '/inventory', label: 'Inventory', Icon: HiOutlineArchiveBox },
  { to: '/notifications', label: 'Alerts', Icon: HiOutlineBell },
  { to: '/settings', label: 'Settings', Icon: HiOutlineCog6Tooth },
  { to: '/about', label: 'About', Icon: HiOutlineInformationCircle },
];

const desktopLinkClass = ({ isActive }) =>
  `flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 active:scale-[0.98] xl:gap-2 xl:px-3 xl:py-2 xl:text-sm ${
    isActive
      ? 'bg-gradient-to-r from-biz-accent to-blue-600 text-white shadow-md shadow-biz-accent/25 dark:from-cyan-600 dark:to-blue-600'
      : 'text-slate-600 hover:bg-slate-100 hover:text-biz-navy dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
  }`;

const drawerLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
    isActive
      ? 'bg-biz-accent/15 text-biz-accent dark:bg-cyan-500/15 dark:text-cyan-300'
      : 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
  }`;

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [bellOpen, setBellOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [tourStep, setTourStep] = useState(null);
  const bellWrapRef = useRef(null);

  useEffect(() => {
    const fetch = () => getUnreadCount().then(({ data }) => setUnread(data.count || 0)).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e) => {
      if (bellWrapRef.current && !bellWrapRef.current.contains(e.target)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const handleLogout = () => {
    setMobileNavOpen(false);
    logout();
    navigate('/');
  };

  const BellButton = (
    <button
      type="button"
      onClick={() => setBellOpen((v) => !v)}
      className="relative rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-2.5"
      aria-expanded={bellOpen}
      aria-haspopup="true"
    >
      <HiOutlineBell className="mx-auto h-5 w-5" />
      {unread > 0 && (
        <span
          className={`absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ${
            bellOpen ? '' : 'animate-pulse md:animate-none'
          }`}
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 shadow-md shadow-slate-900/5 backdrop-blur-lg dark:border-slate-800 dark:bg-biz-slate/95 dark:shadow-black/20">
        <div className="mx-auto max-w-[1600px] px-3 py-2.5 sm:px-4 md:py-3 md:px-5">
          {/* Top bar: brand + menu (mobile) + tools */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="flex shrink-0 items-center justify-center rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden min-h-[44px] min-w-[44px]"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-app-nav"
                aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMobileNavOpen((v) => !v)}
              >
                {mobileNavOpen ? <HiOutlineXMark className="h-6 w-6" /> : <HiOutlineBars3 className="h-6 w-6" />}
              </button>

              <Link
                to="/dashboard"
                className="group flex min-w-0 shrink items-center gap-2 sm:gap-2.5 rounded-xl py-1 pr-1 transition hover:opacity-90 sm:pr-2"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-biz-accent to-indigo-700 text-xs font-black text-white shadow-lg shadow-biz-accent/30 dark:from-cyan-500 dark:to-blue-700 sm:h-10 sm:w-10 sm:text-sm">
                  AB
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-bold tracking-tight text-biz-navy dark:text-white">AutoBiz</span>
                  <span className="hidden truncate text-[10px] font-medium uppercase tracking-wider text-biz-muted dark:text-slate-400 sm:block">
                    Smart Invoicing
                  </span>
                </span>
              </Link>
            </div>

            <div ref={bellWrapRef} className="relative flex shrink-0 items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setTourStep(0)}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden min-h-[44px] min-w-[44px]"
                aria-label="Demo tour"
              >
                <HiOutlinePlayCircle className="mx-auto h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setTourStep(0)}
                className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-biz-accent/40 hover:bg-biz-accent/5 hover:text-biz-accent dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 lg:inline-flex lg:items-center"
              >
                Demo tour
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 md:p-2.5"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <HiOutlineSun className="mx-auto h-5 w-5" /> : <HiOutlineMoon className="mx-auto h-5 w-5" />}
              </button>
              {BellButton}
              {bellOpen && <BellMenu onClose={() => setBellOpen(false)} />}
              <div className="ml-0.5 hidden items-center gap-2 rounded-xl border border-slate-200/90 bg-slate-50/80 py-1 pl-1 pr-2 dark:border-slate-600 dark:bg-slate-800/50 lg:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-biz-accent text-xs font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="hidden max-w-[7rem] lg:block xl:max-w-[10rem]">
                  <p className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{user?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-slate-600 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300 lg:inline"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Desktop / large tablet: all tabs visible (wrap, no horizontal clip) */}
          <nav
            className="mt-3 hidden border-t border-slate-100 pt-3 dark:border-slate-800 lg:block"
            aria-label="Main navigation"
          >
            <div className="flex flex-wrap justify-center gap-x-1 gap-y-2 xl:gap-x-1.5">
              {NAV.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} className={desktopLinkClass}>
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-90 xl:h-4 xl:w-4" aria-hidden />
                  <span className="whitespace-nowrap">{label}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-3 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] dark:border-slate-800 lg:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-biz-accent text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.name}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 dark:border-slate-600 dark:text-slate-300 min-h-[44px]"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Mobile + tablet: full navigation (nothing hidden) */}
      <div
        id="mobile-app-nav"
        className={`fixed inset-0 z-[60] lg:hidden ${mobileNavOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200 ${
            mobileNavOpen ? 'opacity-100' : 'opacity-0'
          }`}
          aria-label="Close menu"
          tabIndex={mobileNavOpen ? 0 : -1}
          onClick={() => setMobileNavOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[min(100%,20rem)] max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-slate-700 dark:bg-biz-slate ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800">
            <span className="text-sm font-bold text-biz-navy dark:text-white">Navigate</span>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px]"
              aria-label="Close menu"
              onClick={() => setMobileNavOpen(false)}
            >
              <HiOutlineXMark className="mx-auto h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))]" aria-label="Mobile navigation">
            {NAV.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} className={drawerLinkClass} onClick={() => setMobileNavOpen(false)}>
                <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>

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
