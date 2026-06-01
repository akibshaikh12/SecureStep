import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'securestep_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const persistToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      return null;
    }
    const { data } = await authApi.me();
    setUser(data.user);
    return data.user;
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        if (localStorage.getItem(TOKEN_KEY)) {
          await refreshUser();
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [refreshUser, clearSession]);

  const login = async (email, password) => {
    setError(null);
    const { data } = await authApi.login({ email, password });
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const completeRegistration = async ({ email, otp }) => {
    setError(null);
    const { data } = await authApi.verifyRegistrationOtp({ email, otp });
    persistToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    clearSession();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      setError,
      login,
      completeRegistration,
      logout,
      refreshUser,
      isAuthenticated: Boolean(user),
    }),
    [user, loading, error, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
