import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Link } from '../router';
import { useAuth, canApprove } from '../auth';
import { useShell } from '../shell/AppShell';
import { Card, EmptyState, PageHeader, SourceBadge, Stat } from '../ui';

type Shift = { at: string; run_id: string; sim_time: string; verdicts: Array<{ verdict: string; needs_human?: boolean }>; dispatched: unknown[]; escalations: unknown[]; summary_en: string; summary_ta?: string };
type Status = { label: string; ok: boolean | null; detail: string };

const STEPS: Record<string, Array<[string, string]>> = {
  farmer: [['Start a scenario in the Agent console and watch the agents work', '/app/console'], ['Open a run marked "veto" and read which rule stopped it', '/app/console'], ['Check a leaf photo in the Crop doctor', '/app/doctor'], ['Ask the Farm assistant something in your language', '/app/assistant'], ['Try to break Solarda yourself', '/app/redteam']],
  agronomist: [['Run the "diseased_leaf_rain" scenario so a treatment needs you', '/app/console'], ['Open Approvals, read why it was sent to you, approve or reject', '/app/approvals'], ['Check that your decision appears with your name', '/app/approvals'], ['Try to break Solarda yourself', '/app/redteam']],
  admin: [['Open Users and see who has which role', '/app/admin'], ['Have a colleague sign up, then give them the agronomist role', '/app/admin'], ['Run a scenario and approve a treatment as an admin', '/app/console']],
};
const readFlag = (k: string) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const setFlag = (k: string) => { try { localStorage.setItem(k, '1'); } catch { /* not remembered in private windows */ } };

const Welcome: React.FC<{ role: string }> = ({ role }) => {
  const key = `solarda.welcome.${role}`;
  const [hidden, setHidden] = useState(() => readFlag(key));
  if (hidden || !STEPS[role]) return null;
  return (
    <Card className="mb-6 border-leaf-200 bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Start here</h2>
          <p className="text-[15px] text-ink/65">A few things to try as {role === 'admin' ? 'an admin' : `a ${role}`}. New to the ideas? Read <Link to="/guide" className="text-leaf-700 underline">how Solarda works</Link>.</p>
        </div>
        <button onClick={() => { setFlag(key); setHidden(true); }} aria-label="Hide this checklist" className="text-ink/50 hover:text-ink"><X className="h-5 w-5" /></button>
      </div>
      <ol className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {STEPS[role].map(([text, to], i) => (
          <li key={text}><Link to={to} className="flex h-full items-start gap-3 rounded-lg border border-leaf-100 px-3 py-2.5 hover:border-leaf-600">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf-700 text-xs font-bold text-white">{i + 1}</span>
            <span className="text-[15px]">{text}</span>
          </Link></li>
        ))}
      </ol>
    </Card>
  );
};

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const getJson = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : Promise.reject(r.status)));

export const Overview: React.FC = () => {
  const { user } = useAuth();
  const { pendingApprovals, backendUp } = useShell();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [status, setStatus] = useState<Status[]>([]);
  const [replay, setReplay] = useState<{ scenario?: string; sim_time?: string; speed?: number; session_id?: string | null }>({});

  useEffect(() => {
    let stop = false;
    const pull = async () => {
      const [audit, agents, vision, rep] = await Promise.allSettled([
        getJson('/api/audit'), getJson('/agents/health'), getJson('/vision/metrics'), getJson('/agents/replay/state'),
      ]);
      if (stop) return;
      if (audit.status === 'fulfilled') setShifts((audit.value.entries ?? []).filter((e: any) => e.type === 'agent' && e.kind === 'shift_summary').reverse());
      if (rep.status === 'fulfilled') setReplay(rep.value);
      const a = agents.status === 'fulfilled' ? agents.value : null;
      setStatus([
        { label: 'Safety engine', ok: a ? Boolean(a.api) : backendUp, detail: 'TypeScript rules, the only part that can allow an action' },
        { label: 'Agent runtime', ok: Boolean(a), detail: 'LangGraph farm-shift agents' },
        { label: 'Leaf disease model', ok: vision.status === 'fulfilled', detail: 'EfficientNetV2 on ONNX, abstains when unsure' },
        { label: 'Language model', ok: a ? true : null, detail: a?.chat ? `Gemini (${a.chat})` : 'Offline advisor (no Gemini key set)' },
      ]);
    };
    pull();
    const t = setInterval(pull, 5000);
    return () => { stop = true; clearInterval(t); };
  }, [backendUp]);

  const blocked = shifts.reduce((n, s) => n + s.verdicts.filter((v) => v.verdict === 'veto').length, 0);
  const done = shifts.reduce((n, s) => n + s.dispatched.length, 0);
  const approver = canApprove(user);

  return (
    <>
      <PageHeader
        title={`${greet()}, ${user?.name ?? ''}`}
        subtitle={approver
          ? (pendingApprovals ? `${pendingApprovals} proposal${pendingApprovals > 1 ? 's wait' : ' waits'} for your decision.` : 'Nothing waits for your decision right now.')
          : 'Here is what the agent proposed, what the safety engine allowed or blocked, and what is waiting for an agronomist.'}
        actions={<Link to="/app/console" className="rounded-full bg-leaf-700 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-800">Open agent console</Link>}
      />

      {user && <Welcome role={user.role} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><Stat label="Waiting for an agronomist" value={pendingApprovals} tone="human" hint={<Link to="/app/approvals" className="underline">Open approvals</Link>} /></Card>
        <Card><Stat label="Actions blocked by safety rules" value={blocked} tone="veto" hint="Across the runs below" /></Card>
        <Card><Stat label="Actions carried out" value={done} tone="allow" hint="Sent once, verified, logged" /></Card>
        <Card><Stat label="Agent runs" value={shifts.length} hint={replay.scenario ? `Scenario: ${replay.scenario.replace(/_/g, ' ')}` : 'No scenario running'} /></Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Recent agent runs</h2>
            <SourceBadge source="replay" />
          </div>
          {!shifts.length ? (
            <div className="mt-4">
              <EmptyState title="No runs yet" body="Start a scenario in the agent console. Each run shows up here with what was done and what was blocked."
                          action={<Link to="/app/console" className="font-semibold text-leaf-700 underline">Start a scenario</Link>} />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-leaf-100">
              {shifts.slice(0, 8).map((s) => {
                const v = s.verdicts.filter((x) => x.verdict === 'veto').length;
                const h = s.verdicts.filter((x) => x.needs_human && x.verdict !== 'veto').length;
                return (
                  <li key={s.run_id + s.at} className="py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="w-28 shrink-0 text-sm text-ink/55">{s.sim_time.slice(5, 16).replace('T', ' ')}</span>
                    <span className="flex-1 min-w-[12rem] text-[15px]">{s.summary_en.replace(' Data is replayed, not from your farm.', '')}</span>
                    {v > 0 && <span className="rounded-full border border-veto/40 px-2 text-sm font-semibold text-veto">{v} blocked</span>}
                    {h > 0 && <span className="rounded-full border border-human/40 px-2 text-sm font-semibold text-human">{h} to a human</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-display text-xl font-bold">System status</h2>
          <ul className="mt-4 space-y-3">
            {status.map((s) => (
              <li key={s.label} className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${s.ok === null ? 'bg-stone-300' : s.ok ? 'bg-allow' : 'bg-veto'}`} aria-hidden />
                <div>
                  <div className="font-semibold">{s.label} <span className="font-normal text-ink/55">{s.ok === null ? 'unknown' : s.ok ? 'running' : 'down'}</span></div>
                  <div className="text-sm text-ink/60">{s.detail}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Replay clock: {replay.sim_time ? `${replay.sim_time.replace('T', ' ').replace('Z', ' UTC')} at ${replay.speed}x` : 'not started'}.
            There are no live farm sensors; readings come from public datasets.
          </div>
        </Card>
      </div>
    </>
  );
};
