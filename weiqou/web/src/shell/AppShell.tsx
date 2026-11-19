import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Activity, AlertTriangle, Bell, Bot, ClipboardCheck, Gauge, Leaf, LogOut, Menu, MessagesSquare, PanelLeftClose, PanelLeftOpen, Settings, ShieldAlert, Sprout, UserCog, Users, X, Zap,
} from 'lucide-react';
import { Link, usePath } from '../router';
import { useAuth } from '../auth';
import { Logo, LogoMark } from '../ui';
import { FarmChat } from '../components/FarmChat';

type Shell = { eStopActive: boolean; toggleEStop: () => void; backendUp: boolean | null; pendingApprovals: number };
const ShellCtx = createContext<Shell>({ eStopActive: false, toggleEStop: () => {}, backendUp: null, pendingApprovals: 0 });
export const useShell = () => useContext(ShellCtx);

const NAV: Array<[string, string, React.ElementType]> = [
  ['/app', 'Overview', Gauge],
  ['/app/console', 'Agent console', Activity],
  ['/app/automation', 'Automation', Zap],
  ['/app/approvals', 'Approvals', ClipboardCheck],
  ['/app/doctor', 'Crop doctor', Leaf],
  ['/app/assistant', 'Farm assistant', MessagesSquare],
  ['/app/redteam', 'Try to break it', ShieldAlert],
  ['/app/insights', 'Water and market', Sprout],
  ['/app/alerts', 'Alerts', Bell],
  ['/app/community', 'Community', Users],
  ['/app/settings', 'Settings', Settings],
];

const ROLE_LABEL = { farmer: 'Farmer', agronomist: 'Agronomist', admin: 'Admin' } as const;

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const path = usePath();
  const { user, logout } = useAuth();
  const [eStopActive, setEStop] = useState(false);
  const [backendUp, setBackendUp] = useState<boolean | null>(null);
  const [pendingApprovals, setPending] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  // Desktop sidebar: icons only when collapsed. The choice is remembered per browser (storage may be blocked).
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('solarda.sidebar') === 'collapsed'; } catch { return false; } });
  const toggleSidebar = () => setCollapsed((c) => {
    try { localStorage.setItem('solarda.sidebar', c ? 'open' : 'collapsed'); } catch { /* ignore */ }
    return !c;
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      try {
        const h = await fetch('/api/health').then((r) => (r.ok ? r.json() : Promise.reject()));
        if (stop) return;
        setBackendUp(true);
        setEStop(Boolean(h.eStopActive));
        const runs: Record<string, { status: string }> = await fetch('/agents/runs').then((r) => r.json());
        if (!stop) setPending(Object.values(runs).filter((r) => r.status === 'awaiting_approval').length);
      } catch {
        if (!stop) setBackendUp(false);
      }
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => { stop = true; clearInterval(t); };
  }, []);

  useEffect(() => setMenuOpen(false), [path]);

  // The server decides: anyone may stop, only an agronomist or admin may clear. Show what it says.
  const toggleEStop = async () => {
    setNotice(null);
    try {
      const r = await fetch('/api/estop', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ active: !eStopActive }) });
      const b = await r.json();
      if (typeof b.eStopActive === 'boolean') setEStop(b.eStopActive);
      if (!r.ok) setNotice(b.error ?? 'The emergency stop could not be changed.');
    } catch {
      setNotice('Cannot reach the safety engine. Nothing was changed.');
    }
  };

  const nav = (
    <nav className="flex flex-col gap-0.5" aria-label="Main">
      {[...NAV, ...(user?.role === 'admin' ? [['/app/admin', 'Users', UserCog] as [string, string, React.ElementType]] : [])].map(([to, label, Icon]) => {
        const active = to === '/app' ? path === '/app' : path.startsWith(to);
        return (
          <Link key={to} to={to} aria-current={active ? 'page' : undefined}
                title={collapsed ? label : undefined} aria-label={label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition ${collapsed ? 'lg:justify-center' : ''} ${active ? 'bg-white/10 text-white font-semibold' : 'text-leaf-100/75 hover:text-white hover:bg-white/5'}`}>
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
            {to === '/app/approvals' && pendingApprovals > 0 && (
              <span className={`rounded-full bg-sprout px-2 text-xs font-bold text-leaf-950 ${collapsed ? 'lg:hidden' : ''}`}>{pendingApprovals}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <ShellCtx.Provider value={{ eStopActive, toggleEStop, backendUp, pendingApprovals }}>
      <div className={`min-h-screen bg-paper transition-[padding] ${collapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-leaf-900 focus:shadow">Skip to main content</a>
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-leaf-950 px-4 py-5 flex flex-col gap-6 transition-all lg:translate-x-0 ${collapsed ? 'lg:w-16 lg:px-2' : ''} ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className={`flex items-center justify-between px-2 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
            <Link to="/" aria-label="Solarda home" className={collapsed ? 'lg:hidden' : ''}><Logo light /></Link>
            {collapsed && <button className="hidden lg:block" onClick={toggleSidebar} aria-label="Expand sidebar" title="Expand sidebar"><LogoMark light size={32} /></button>}
            <button className={`hidden text-leaf-100/80 hover:text-white ${collapsed ? '' : 'lg:block'}`} onClick={toggleSidebar} aria-label="Collapse sidebar" aria-expanded={!collapsed} title="Collapse sidebar"><PanelLeftClose className="h-5 w-5" /></button>
            <button className="lg:hidden text-white" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
          </div>
          {nav}
          <div className={`mt-auto rounded-lg bg-white/5 px-3 py-3 text-sm text-leaf-100 ${collapsed ? 'lg:hidden' : ''}`}>
            <div className="font-semibold text-white">{user?.name}</div>
            <div className="text-leaf-100/70">{user ? ROLE_LABEL[user.role] : ''} · {user?.email}</div>
            <Link to="/guide" className="mt-2 block text-leaf-100/80 underline hover:text-white">How Solarda works</Link>
            <button onClick={logout} className="mt-2 inline-flex items-center gap-1.5 text-leaf-100/80 hover:text-white">
              <LogOut className="h-4 w-4" aria-hidden /> Sign out
            </button>
          </div>
          {collapsed && (
            <div className="mt-auto hidden flex-col items-center gap-3 lg:flex">
              <button onClick={toggleSidebar} aria-label="Expand sidebar" title="Expand sidebar" className="text-leaf-100/80 hover:text-white"><PanelLeftOpen className="h-5 w-5" /></button>
              <button onClick={logout} aria-label="Sign out" title="Sign out" className="text-leaf-100/80 hover:text-white"><LogOut className="h-5 w-5" /></button>
            </div>
          )}
        </aside>
        {menuOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} />}

        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-leaf-100 bg-paper/90 backdrop-blur px-4 lg:px-8 py-3">
          <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden /> Replay mode: no live farm sensors
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setChatOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white px-3 py-1.5 text-sm font-medium text-leaf-900 hover:border-leaf-600">
              <Bot className="h-4 w-4" aria-hidden /> Ask Solarda
            </button>
            <button onClick={toggleEStop} aria-pressed={eStopActive} title={eStopActive && user?.role === 'farmer' ? 'An agronomist or admin can clear the emergency stop' : 'Emergency stop: blocks every action'}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${eStopActive ? 'bg-veto text-white' : 'border border-veto/40 bg-white text-veto'}`}>
              <AlertTriangle className="h-4 w-4" aria-hidden /> {eStopActive ? (user?.role === 'farmer' ? 'E-stop on' : 'E-stop on: tap to clear') : 'E-stop'}
            </button>
          </div>
        </header>

        {notice && (
          <div role="alert" className="mx-4 lg:mx-8 mt-4 flex items-start justify-between gap-3 rounded-xl border border-veto/30 bg-red-50 px-4 py-3 text-sm text-veto">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button>
          </div>
        )}

        {backendUp === false && (
          <div role="status" className="mx-4 lg:mx-8 mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <b>The agents are not running here.</b> This page is a preview. The agents, safety engine and models run on the local stack:
            clone the repo and run <code className="font-mono">make setup && make dev</code>.
          </div>
        )}

        <main id="main" tabIndex={-1} className="px-4 lg:px-8 py-6 max-w-[1400px] focus:outline-none">{children}</main>

        {chatOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setChatOpen(false)}>
            <div className="h-full w-full max-w-lg bg-paper p-3 flex flex-col gap-2" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Farm assistant">
              <div className="flex items-center justify-between px-1">
                <span className="font-display text-lg font-bold text-leaf-950">Farm assistant</span>
                <button onClick={() => setChatOpen(false)} aria-label="Close assistant"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 min-h-0"><FarmChat lowBandwidth={false} fill /></div>
            </div>
          </div>
        )}
      </div>
    </ShellCtx.Provider>
  );
};
