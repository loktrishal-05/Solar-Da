import React from 'react';
import { usePath, Link } from './router';
import { AuthProvider, RequireAuth, useAuth, canApprove } from './auth';
import { AppShell, useShell } from './shell/AppShell';
import { EmptyState, PageHeader } from './ui';
import { Login, Signup } from './pages/Auth';
import { Landing } from './pages/Landing';
import { Overview } from './pages/Overview';
import { Approvals } from './pages/Approvals';
import { RedTeam } from './pages/RedTeam';
import { AssistantPage, AlertsPage, CommunityPage, DoctorPage, InsightsPage, SettingsPage } from './pages/Wrapped';
import { AgentConsole } from './components/AgentConsole';

const ConsolePage: React.FC = () => {
  const { eStopActive, toggleEStop } = useShell();
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Agent console" subtitle="Replay a farm scenario and watch every run: what triggered it, what each specialist proposed, what the safety engine decided, and who approved." />
      <AgentConsole eStopActive={eStopActive} onToggleEStop={toggleEStop} canApprove={canApprove(user)} />
    </>
  );
};

const APP_PAGES: Record<string, React.FC> = {
  '/app': Overview,
  '/app/approvals': Approvals,
  '/app/redteam': RedTeam,
  '/app/console': ConsolePage,
  '/app/doctor': DoctorPage,
  '/app/assistant': AssistantPage,
  '/app/insights': InsightsPage,
  '/app/alerts': AlertsPage,
  '/app/community': CommunityPage,
  '/app/settings': SettingsPage,
};

const NotFound: React.FC = () => (
  <EmptyState title="This page does not exist" body="The link may be old." action={<Link to="/app" className="font-semibold text-leaf-700 underline">Go to the overview</Link>} />
);

const Routes: React.FC = () => {
  const path = usePath().replace(/\/+$/, '') || '/';
  if (path === '/') return <Landing />;
  if (path === '/login') return <Login />;
  if (path === '/signup') return <Signup />;
  if (path === '/app' || path.startsWith('/app/')) {
    const Page = APP_PAGES[path] ?? NotFound;
    return <RequireAuth><AppShell><Page /></AppShell></RequireAuth>;
  }
  return <div className="min-h-screen grid place-items-center p-6"><NotFound /></div>;
};

export const App: React.FC = () => (
  <AuthProvider>
    <Routes />
  </AuthProvider>
);

export default App;
