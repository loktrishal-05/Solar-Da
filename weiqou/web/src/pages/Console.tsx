import React from 'react';
import { useAuth, canApprove } from '../auth';
import { useShell } from '../shell/AppShell';
import { PageHeader } from '../ui';
import { AgentConsole } from '../components/AgentConsole';

export const ConsolePage: React.FC = () => {
  const { eStopActive, toggleEStop } = useShell();
  const { user } = useAuth();
  return (
    <>
      <PageHeader title="Agent console" subtitle="Replay a farm scenario and watch every run: what triggered it, what each specialist proposed, what the safety engine decided, and who approved." />
      <AgentConsole eStopActive={eStopActive} onToggleEStop={toggleEStop} canApprove={canApprove(user)} />
    </>
  );
};
