import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ClipboardCheck, ShieldCheck, Sprout } from 'lucide-react';
import { Link, navigate, useQuery } from '../router';
import { useAuth, type Role } from '../auth';
import { Button, Logo } from '../ui';

// Where each demo role lands first.
export const HOME_FOR: Record<Role, string> = { farmer: '/app', agronomist: '/app/approvals', admin: '/app/admin' };

const DEMO: Array<{ role: Role; title: string; does: string; icon: React.ElementType }> = [
  { role: 'farmer', title: 'Farmer', does: 'Watch the farm, run the agent, ask the assistant, check a leaf photo.', icon: Sprout },
  { role: 'agronomist', title: 'Agronomist', does: 'Everything a farmer can do, plus approve or reject treatments.', icon: ClipboardCheck },
  { role: 'admin', title: 'Admin', does: 'Everything above, plus manage users and give the agronomist role.', icon: ShieldCheck },
];

const field = (bad: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 ${bad ? 'border-veto ring-veto/20 focus:ring-veto/30' : 'border-leaf-200 focus:border-leaf-600 focus:ring-leaf-600/20'}`;

const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div role="alert" className="flex items-start gap-2 rounded-lg border border-veto/40 bg-red-50 px-3 py-2.5 text-sm text-veto animate-[fadeIn_200ms_ease-out]">
    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
    <span>{message}</span>
  </div>
);

const Frame: React.FC<{ title: string; intro: string; children: React.ReactNode }> = ({ title, intro, children }) => {
  const [apiDown, setApiDown] = useState(false);
  // A static host may answer /api with index.html, so only a JSON reply counts as "API up".
  useEffect(() => { fetch('/api/health').then((r) => (r.ok ? r.json() : Promise.reject())).then(() => setApiDown(false)).catch(() => setApiDown(true)); }, []);
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] bg-paper">
      <div className="flex flex-col px-6 sm:px-12 py-8">
        <Link to="/"><Logo /></Link>
        <div className="my-auto w-full max-w-md py-10">
          <h1 className="font-display text-3xl font-bold text-leaf-950">{title}</h1>
          <p className="mt-1 text-ink/65">{intro}</p>
          {apiDown && (
            <p role="status" className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              This is a preview of the web app only. Sign-in, the agents and the safety engine run on the local stack: clone the repo and run <code className="font-mono">make setup && make dev</code>.
            </p>
          )}
          {children}
        </div>
      </div>
      <aside className="relative hidden lg:block overflow-hidden bg-leaf-950">
        <blockquote className="absolute inset-x-12 bottom-12 max-w-md">
          <p className="font-display text-3xl font-bold leading-tight text-white">The agent can ask as often as it likes. The safety engine decides.</p>
          <p className="mt-4 text-leaf-100/75">Every action passes 13 safety rules. Anything risky waits for a person with the right role.</p>
        </blockquote>
      </aside>
    </div>
  );
};

export const Login: React.FC = () => {
  const { login, demo } = useAuth();
  const next = useQuery('next');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('form'); setError(null);
    try {
      await login(email, password);
      navigate(next?.startsWith('/app') ? next : '/app', true);
    } catch (err) {
      setError((err as Error).message);
      setPassword('');
      pwRef.current?.focus();
    } finally {
      setBusy(null);
    }
  };

  const tryRole = async (role: Role) => {
    setBusy(role); setError(null);
    try {
      await demo(role);
      navigate(HOME_FOR[role], true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Frame title="Welcome to Solarda" intro="Try it instantly as one of three people, or sign in with your own account.">
      <div className="mt-6 grid gap-2.5" role="group" aria-label="Try a demo account">
        {DEMO.map(({ role, title, does, icon: Icon }) => (
          <button key={role} type="button" onClick={() => tryRole(role)} disabled={busy !== null}
                  className="group flex items-start gap-3 rounded-xl border border-leaf-100 bg-white px-4 py-3 text-left transition hover:border-leaf-600 hover:shadow-sm disabled:opacity-60">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-leaf-50 text-leaf-700 transition group-hover:bg-leaf-700 group-hover:text-white">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">{busy === role ? `Signing in as ${title}…` : `Continue as ${title}`}</span>
              <span className="block text-sm text-ink/60">{does}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="my-6 flex items-center gap-3 text-sm text-ink/50"><span className="h-px flex-1 bg-leaf-100" />or use your account<span className="h-px flex-1 bg-leaf-100" /></div>

      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBox message={error} />}
        <label className="block text-sm font-medium">Email
          <input className={`${field(!!error)} mt-1`} type="email" autoComplete="username" required value={email}
                 aria-invalid={!!error} onChange={(e) => { setEmail(e.target.value); setError(null); }} />
        </label>
        <label className="block text-sm font-medium">Password
          <input ref={pwRef} className={`${field(!!error)} mt-1`} type="password" autoComplete="current-password" required value={password}
                 aria-invalid={!!error} onChange={(e) => { setPassword(e.target.value); setError(null); }} />
        </label>
        <Button className="w-full py-2.5" disabled={busy !== null}>{busy === 'form' ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      <p className="mt-6 text-sm text-ink/70">New here? <Link to="/signup" className="font-semibold text-leaf-700 underline">Create an account</Link></p>
    </Frame>
  );
};

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => { setForm({ ...form, [k]: e.target.value }); setError(null); };

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
    <Frame title="Create your account" intro="New accounts start as farmers. An admin can give you the agronomist role.">
      <form onSubmit={submit} className="mt-6 space-y-4">
        {error && <ErrorBox message={error} />}
        <label className="block text-sm font-medium">Your name
          <input className={`${field(false)} mt-1`} required autoComplete="name" value={form.name} onChange={set('name')} />
        </label>
        <label className="block text-sm font-medium">Email
          <input className={`${field(!!error && /email|account/i.test(error))} mt-1`} type="email" required autoComplete="email" value={form.email} onChange={set('email')} />
        </label>
        <label className="block text-sm font-medium">Password (8 characters or more)
          <input className={`${field(!!error && /password/i.test(error))} mt-1`} type="password" minLength={8} required autoComplete="new-password" value={form.password} onChange={set('password')} />
        </label>
        <Button className="w-full py-2.5" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </form>
      <p className="mt-8 text-sm text-ink/70">Already have an account? <Link to="/login" className="font-semibold text-leaf-700 underline">Sign in</Link></p>
    </Frame>
  );
};
