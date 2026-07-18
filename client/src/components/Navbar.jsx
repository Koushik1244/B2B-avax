import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext'; // import ThemeContext

const navLinks = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/customers', label: 'Customers' },
  { to: '/invoices',  label: 'Invoices'  },
  { to: '/about',     label: 'About'     },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // use ThemeContext
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { 
    logout(); 
    navigate('/'); 
  };

  return (
    <nav className="bg-white dark:bg-biz.slate border-b border-gray-200 dark:border-biz.borderDark px-4 md:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="text-base md:text-lg font-bold text-indigo-600 dark:text-white shrink-0">
          Smart Invoicing
        </Link>

        {/* Nav links */}
        <div className="flex gap-0.5 overflow-x-auto">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition 
                ${
                  location.pathname === to
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-biz.navy dark:text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-biz.navy'
                }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User + logout + theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="px-2 py-1 rounded-md border border-gray-200 dark:border-biz.borderDark text-sm text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-biz.navy transition"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* User */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-700 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-white">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-200 font-medium">{user?.name}</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-xs border border-gray-200 dark:border-biz.borderDark hover:border-red-300 hover:text-red-600 dark:hover:text-red-400 text-gray-500 dark:text-gray-200 font-medium px-3 py-1.5 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}