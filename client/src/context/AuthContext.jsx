import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, hasSessionHint, setSessionHint } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasSessionHint());

  useEffect(() => {
    if (!hasSessionHint()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setSessionHint(false))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(() => {
    setSessionHint(false);
    setUser(null);
    api('/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  useEffect(() => {
    window.addEventListener('arede:unauthorized', logout);
    return () => window.removeEventListener('arede:unauthorized', logout);
  }, [logout]);

  const authenticate = useCallback(async (path, body) => {
    const data = await api(path, { method: 'POST', body });
    setSessionHint(true);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login: (body) => authenticate('/auth/login', body),
      register: (body) => authenticate('/auth/register', body),
      logout,
      updateProfile: async (body) => {
        const data = await api('/auth/me', { method: 'PATCH', body });
        setUser(data.user);
        return data.user;
      },
    }),
    [user, loading, authenticate, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
