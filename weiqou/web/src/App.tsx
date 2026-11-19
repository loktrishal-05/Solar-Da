import React, { Suspense, lazy, useEffect } from 'react';
import { usePath, Link } from './router';
import { AuthProvider, RequireAuth } from './auth';
import { AppShell } from './shell/AppShell';
import { EmptyState } from './ui';
import { Landing } from './pages/Landing';

// Every page except the landing page is its own chunk, loaded when first visited.
const named = <K extends string>(load: () => Promise<Record<K, React.FC>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const wrapped = () => import('./pages/Wrapped');
const Login = named(() => import('./pages/Auth'), 'Login');
const Signup = named(() => import('./pages/Auth'), 'Signup');
const Guide = named(() => import('./pages/Guide'), 'Guide');

const APP_PAGES: Record<string, React.LazyExoticComponent<React.FC>> = {
  '/app': named(() => import('./pages/Overview'), 'Overview'),
  '/app/approvals': named(() => import('./pages/Approvals'), 'Approvals'),
  '/app/redteam': named(() => import('./pages/RedTeam'), 'RedTeam'),
  '/app/admin': named(() => import('./pages/Admin'), 'Admin'),
  '/app/console': named(() => import('./pages/Console'), 'ConsolePage'),
  '/app/doctor': named(wrapped, 'DoctorPage'),
  '/app/assistant': named(wrapped, 'AssistantPage'),
  '/app/insights': named(wrapped, 'InsightsPage'),
  '/app/alerts': named(wrapped, 'AlertsPage'),
  '/app/community': named(wrapped, 'CommunityPage'),
  '/app/settings': named(wrapped, 'SettingsPage'),
};

const Loading: React.FC = () => <div className="py-16 text-center text-ink/70" role="status" aria-live="polite">Loading…</div>;

const NotFound: React.FC = () => (
  <EmptyState title="This page does not exist" body="The link may be old." action={<Link to="/app" className="font-semibold text-leaf-700 underline">Go to the overview</Link>} />
);

const TITLES: Record<string, string> = {
  '/login': 'Sign in', '/signup': 'Create account', '/guide': 'How Solarda works', '/app': 'Overview', '/app/console': 'Agent console',
  '/app/approvals': 'Approvals', '/app/doctor': 'Crop doctor', '/app/assistant': 'Farm assistant', '/app/redteam': 'Try to break it',
  '/app/insights': 'Water and market', '/app/alerts': 'Alerts', '/app/community': 'Community', '/app/settings': 'Settings', '/app/admin': 'Users',
};

const Routes: React.FC = () => {
  const path = usePath().replace(/\/+$/, '') || '/';
  useEffect(() => {
    document.title = TITLES[path] ? `${TITLES[path]} · Solarda` : 'Solarda: safety-gated farm agents';
  }, [path]);
  if (path === '/') return <Landing />;
  if (path === '/login') return <Suspense fallback={<Loading />}><Login /></Suspense>;
  if (path === '/signup') return <Suspense fallback={<Loading />}><Signup /></Suspense>;
  if (path === '/guide') return <Suspense fallback={<Loading />}><Guide /></Suspense>;
  if (path === '/app' || path.startsWith('/app/')) {
    const Page = APP_PAGES[path] ?? NotFound;
    return <RequireAuth><AppShell><Suspense fallback={<Loading />}><Page /></Suspense></AppShell></RequireAuth>;
  }
  return <div className="min-h-screen grid place-items-center p-6"><NotFound /></div>;
};

export const App: React.FC = () => (
  <AuthProvider>
    <Routes />
  </AuthProvider>
);

export default App;
