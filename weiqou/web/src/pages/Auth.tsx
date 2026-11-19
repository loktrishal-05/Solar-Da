import React, { useState } from 'react';
import { Link, navigate, useQuery } from '../router';
import { useAuth } from '../auth';
import { Button, Logo } from '../ui';

const DEMO = [
  ['farmer@solarda.demo', 'Demo farmer', 'Watches the farm, raises photos, sees what the agent did'],
  ['agronomist@solarda.demo', 'Demo agronomist', 'Approves or rejects treatments the agent proposes'],
] as const;

const field = 'w-full rounded-lg border border-leaf-200 bg-white px-3 py-2.5 text-[15px] focus:border-leaf-600 focus:outline-none';

const Frame: React.FC<{ title: string; children: React.ReactNode; aside: React.ReactNode }> = ({ title, children, aside }) => (
  <div className="min-h-screen grid lg:grid-cols-[1fr_1.1fr] bg-paper">
    <div className="flex flex-col px-6 sm:px-12 py-8">
      <Link to="/"><Logo /></Link>
      <div className="my-auto w-full max-w-sm py-10">
        <h1 className="font-display text-3xl font-bold text-leaf-950">{title}</h1>
        {children}
      </div>
    </div>
    <div className="hidden lg:flex flex-col justify-end bg-leaf-950 p-12 text-leaf-100">{aside}</div>
  </div>
);

const Aside = () => (
  <blockquote className="max-w-md">
    <p className="font-display text-3xl font-bold leading-tight text-white">The agent can ask as often as it likes. The safety engine decides.</p>
    <p className="mt-4 text-leaf-100/75">Every action passes 13 safety rules. Anything risky waits for a person with the right role.</p>
  </blockquote>
);

export const Login: React.FC = () => {
  const { login } = useAuth();
  const next = useQuery('next') ?? '/app';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await login(email, password);
      navigate(next.startsWith('/app') ? next : '/app', true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame title="Sign in" aside={<Aside />}>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Email
          <input className={`${field} mt-1`} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm font-medium">Password
          <input className={`${field} mt-1`} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p role="alert" className="text-sm text-veto">{error}</p>}
        <Button className="w-full py-2.5" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <div className="mt-8">
        <div className="text-sm font-medium text-ink/70">Demo accounts (password in weiqou/api/seed/users.json)</div>
        <div className="mt-2 grid gap-2">
          {DEMO.map(([mail, label, what]) => (
            <button key={mail} type="button" onClick={() => setEmail(mail)}
                    className={`rounded-lg border px-3 py-2 text-left transition ${email === mail ? 'border-leaf-600 bg-leaf-50' : 'border-leaf-100 bg-white hover:border-leaf-200'}`}>
              <div className="text-sm font-semibold">{label}</div>
              <div className="text-xs text-ink/60">{what}</div>
            </button>
          ))}
        </div>
      </div>
      <p className="mt-8 text-sm text-ink/70">New here? <Link to="/signup" className="font-semibold text-leaf-700 underline">Create an account</Link></p>
    </Frame>
  );
};

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'farmer' as 'farmer' | 'agronomist' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await signup(form);
      navigate('/app', true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame title="Create your account" aside={<Aside />}>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Your name
          <input className={`${field} mt-1`} required autoComplete="name" value={form.name} onChange={set('name')} />
        </label>
        <label className="block text-sm font-medium">Email
          <input className={`${field} mt-1`} type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="block text-sm font-medium">Password (8 characters or more)
          <input className={`${field} mt-1`} type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={set('password')} />
        </label>
        <label className="block text-sm font-medium">I am a
          <select className={`${field} mt-1`} value={form.role} onChange={set('role')}>
            <option value="farmer">Farmer or farm manager</option>
            <option value="agronomist">Agronomist (can approve treatments)</option>
          </select>
        </label>
        {error && <p role="alert" className="text-sm text-veto">{error}</p>}
        <Button className="w-full py-2.5" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="mt-8 text-sm text-ink/70">Already have an account? <Link to="/login" className="font-semibold text-leaf-700 underline">Sign in</Link></p>
    </Frame>
  );
};
