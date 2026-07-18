import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, useTrackOnRouteChange } from '../context/AuthContext';
import AppNavbar from './AppNavbar';
import PageRibbon from './PageRibbon';

export default function Layout() {
  const { user } = useAuth();
  useTrackOnRouteChange();

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col text-slate-900 dark:text-slate-100">
      <AppNavbar />
      <PageRibbon />
      <div className="flex-1 overflow-x-hidden overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
        <Outlet />
      </div>
    </div>
  );
}
