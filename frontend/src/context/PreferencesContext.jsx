import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { userApi } from '../services/api';
import { useAuth } from './AuthContext';

const PreferencesContext = createContext(null);

const defaultPrefs = {
  notifications: true,
  sosSound: true,
  theme: 'dark',
};

function readStoredPrefs() {
  try {
    const raw = localStorage.getItem('securestep_prefs');
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultPrefs;
}

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isDark ? '#0c0c14' : '#f4f5f9');
}

const initialPrefs = readStoredPrefs();
applyTheme(initialPrefs.theme);

export function PreferencesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState(initialPrefs);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      const prefs = readStoredPrefs();
      setPreferences(prefs);
      applyTheme(prefs.theme);
      return;
    }
    setLoading(true);
    try {
      const { data } = await userApi.getPreferences();
      const prefs = { ...defaultPrefs, ...data.preferences };
      setPreferences(prefs);
      applyTheme(prefs.theme);
      localStorage.setItem('securestep_prefs', JSON.stringify(prefs));
    } catch {
      /* keep current */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const updatePreferences = async (patch) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    applyTheme(next.theme);
    localStorage.setItem('securestep_prefs', JSON.stringify(next));

    if (!isAuthenticated) {
      return next;
    }

    try {
      const { data } = await userApi.updatePreferences(patch);
      const synced = { ...defaultPrefs, ...data.preferences };
      setPreferences(synced);
      applyTheme(synced.theme);
      localStorage.setItem('securestep_prefs', JSON.stringify(synced));
      return synced;
    } catch (err) {
      setPreferences(next);
      applyTheme(next.theme);
      throw err;
    }
  };

  const value = useMemo(
    () => ({ preferences, loading, updatePreferences, reload: load }),
    [preferences, loading, updatePreferences, load]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
