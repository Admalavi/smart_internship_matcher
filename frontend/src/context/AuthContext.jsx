import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, TOKEN_KEY } from '../services/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) { setUser(null); setLoading(false); return; }
    try { setUser((await authApi.me()).data.user); } catch { localStorage.removeItem(TOKEN_KEY); setUser(null); }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const finish = (res) => { localStorage.setItem(TOKEN_KEY, res.data.token); setUser(res.data.user); return res.data.user; };
  const login = async (email, password) => finish(await authApi.login({ email, password }));
  const register = async (body) => finish(await authApi.register(body));
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export const homeFor = (role) => (role === 'admin' ? '/admin' : role === 'company' ? '/company' : '/student');
