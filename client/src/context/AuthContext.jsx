import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // ── Activity tracking ─────────────────────────────────────────────────────
  // Debounced so we don't spam the server on every click — fires at most once/min.
  const lastTracked = useRef(0);

  const trackActivity = useCallback(() => {
    if (!user) return;
    const now = Date.now();
    if (now - lastTracked.current < 60_000) return; // 1-minute debounce
    lastTracked.current = now;
    api.patch('/auth/activity').catch(() => {}); // fire-and-forget, silent fail
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, trackActivity }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

/**
 * Drop this hook inside any component that should trigger activity tracking.
 * Call it at the top-level of Layout so every route change pings the server.
 */
export function useTrackOnRouteChange() {
  const { trackActivity } = useAuth();
  const location = useLocation();
  useEffect(() => {
    trackActivity();
  }, [location.pathname, trackActivity]);
}
