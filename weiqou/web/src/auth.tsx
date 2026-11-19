import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { navigate, usePath } from './router';

export type Role = 'farmer' | 'agronomist' | 'admin';
export type User = { id: string; name: string; email: string; role: Role };
type SignupInput = { name: string; email: string; password: string; role: 'farmer' | 'agronomist' };

type AuthState = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

async function send(path: string, body: unknown): Promise<User> {
  let r: Response;
  try {
    r = await fetch(`/api/auth/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('Cannot reach the Solarda API. Start the local stack with make dev.');
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.user) throw new Error(data.error ?? 'Cannot reach the Solarda API. Start the local stack with make dev.');
  return data.user;
}

export const canApprove = (u: User | null) => u?.role === 'agronomist' || u?.role === 'admin';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => setUser(await send('login', { email, password })), []);
  const signup = useCallback(async (input: SignupInput) => setUser(await send('signup', input)), []);
  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    navigate('/');
  }, []);

  return <Ctx.Provider value={{ user, loading, login, signup, logout }}>{children}</Ctx.Provider>;
};

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}

export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const path = usePath();
  useEffect(() => {
    if (!loading && !user) navigate(`/login?next=${encodeURIComponent(path)}`, true);
  }, [loading, user, path]);
  if (loading || !user) return <div className="min-h-screen bg-paper" aria-busy="true" />;
  return <>{children}</>;
};
