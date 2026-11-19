import React, { useCallback, useEffect, useState } from 'react';
import { useAuth, canApprove } from '../auth';
import { Button, Card, PageHeader, SourceBadge, VerdictStamp, verdictOf } from '../ui';

type Case = { title: string; story: string };
type Command = { action_id: string; kind: string; zone: string; device: string; params: Record<string, unknown>; status: string; status_note: string };
type Status = { mode: 'firebase' | 'simulated'; note: string; cases: Record<string, Case>; commands: Command[] };
type Action = { id: string; kind: string; zone: string; params: Record<string, unknown>; why: string; expected: string; verdict: string; rule?: string;
  verdict_reason?: string; needs_human: boolean; state: string; hardware?: Command };
type Agent = { name: string; saw: string; status: string; actions: Action[] };
type Report = { run_id: string; status: string; data_source: string; agents: Agent[]; hardware_queue: Command[];
  orchestrator: { summary: string; by: string; awaiting_approval: number; dispatched: number; blocked: number } };

const KIND: Record<string, string> = { irrigate: 'Water the bed', dose_ph: 'Adjust pH', dose_nutrient: 'Add nutrients (potassium mix)', treat_disease: 'Treat disease', alert: 'Alert', ventilate: 'Ventilate', shade: 'Shade' };
const STATE: Record<string, string> = { dispatched: 'Queued for hardware', vetoed: 'Blocked by safety engine', 'awaiting approval': 'Waiting for approval', allowed: 'Allowed', rejected: 'Rejected' };
const params = (p: Record<string, unknown>) => Object.entries(p).filter(([, v]) => typeof v !== 'object').map(([k, v]) => `${k.replace(/_/g, ' ')}: ${String(v).replace(/_/g, ' ')}`).join(' · ');
const post = (url: string, body?: unknown) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

const Step: React.FC<{ n: number; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
  <section className="mt-8">
    <h2 className="mb-3 flex items-center gap-3 font-display text-xl font-bold text-leaf-950">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-leaf-900 text-sm text-white">{n}</span>{title}
    </h2>
    {children}
  </section>
);

export const Automation: React.FC = () => {
  const { user } = useAuth();
  const approver = canApprove(user);
  const [status, setStatus] = useState<Status | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => fetch('/agents/firebase/status').then((r) => r.json()).then(setStatus).catch(() => setError('Cannot reach the agent service.')), []);
  useEffect(() => { load(); }, [load]);

  const fail = async (r: Response) => { const b = await r.json().catch(() => ({})); setError(b.detail ?? b.error ?? `HTTP ${r.status}`); };

  const send = async () => {
    if (!picked) return;
    setBusy('send'); setError(null); setReport(null);
    const r = await post('/agents/firebase/seed', { case: picked });
    if (!r.ok) await fail(r);
    else { const b = await r.json(); setSent(`${b.readings} sensor readings${b.images ? ' and 1 camera photo' : ''} written to Firebase (${b.written_to}).`); }
    setBusy(null); load();
  };
  const run = async () => {
    setBusy('run'); setError(null);
    const r = await post('/agents/firebase/run');
    if (!r.ok) await fail(r); else setReport(await r.json());
    setBusy(null);
  };
  const approve = async (decision: 'approve' | 'reject') => {
    if (!report) return;
    setBusy(decision); setError(null);
    const pending = report.agents.flatMap((a) => a.actions).filter((a) => a.state === 'awaiting approval');
    const r = await post(`/api/runs/${encodeURIComponent(report.run_id)}/resume`,
      { approvals: pending.map((a) => ({ proposal_id: a.id, decision, ts: new Date().toISOString() })) });
    if (!r.ok) await fail(r);
    else setReport(await fetch(`/agents/firebase/report/${encodeURIComponent(report.run_id)}`).then((x) => x.json()));
    setBusy(null); load();
  };

  const o = report?.orchestrator;
  const badge = <SourceBadge source={status?.mode === 'firebase' ? 'live' : 'sim'} />;
  return (
    <>
      <PageHeader title="Automation"
        subtitle="Sensors write to Firebase. The agents read it, an orchestrator reports, and approved commands are queued for the pump and dispensers."
        actions={badge} />
      {status && <p className="text-sm text-ink/70">{status.mode === 'firebase' ? 'Connected to your Firebase database.' : status.note} The ESP32 and pumps are not wired yet, so commands wait in a queue.</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-veto/30 bg-red-50 px-4 py-2 text-sm text-veto">{error}</p>}

      <Step n={1} title="Sensors send data to Firebase">
        <p className="mb-3 text-sm text-ink/70">Pick what the pH, moisture and camera sensors report. This button does what the ESP32 will do on the real farm.</p>
        <div className="grid gap-3 md:grid-cols-2">
          {status && Object.entries(status.cases).map(([id, c]) => (
            <button key={id} onClick={() => setPicked(id)} aria-pressed={picked === id}
              className={`rounded-xl border p-4 text-left transition ${picked === id ? 'border-leaf-700 bg-leaf-50 ring-2 ring-leaf-600' : 'border-leaf-200 bg-white hover:border-leaf-400'}`}>
              <div className="font-display text-lg font-bold text-leaf-950">{c.title}</div>
              <div className="text-sm text-ink/70">{c.story}</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={send} disabled={!picked || busy === 'send'}>{busy === 'send' ? 'Sending…' : 'Send sensor data to Firebase'}</Button>
          {sent && <span className="text-sm font-medium text-allow">{sent}</span>}
        </div>
      </Step>

      <Step n={2} title="Agents read Firebase and decide">
        <Button onClick={run} disabled={!sent || busy === 'run'}>{busy === 'run' ? 'Agents working…' : 'Run automation'}</Button>
        {!sent && <span className="ml-3 text-sm text-ink/60">Send data first.</span>}
        {report && o && (
          <div className="mt-4 space-y-4">
            <Card>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-leaf-800">Orchestrator report {badge}</div>
              <p className="mt-2 text-[17px] leading-relaxed text-leaf-950">{o.summary}</p>
              <p className="mt-1 text-xs text-ink/60">{o.awaiting_approval} waiting for approval · {o.dispatched} queued for hardware · {o.blocked} blocked by the safety engine · written by {o.by === 'rules' ? 'rules' : 'Gemini from the rule-based facts'}</p>
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              {report.agents.map((ag) => (
                <Card key={ag.name} as="article">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-leaf-950">{ag.name}</h3>
                    <span className="rounded-full border border-leaf-200 px-2 py-0.5 text-xs font-medium text-leaf-800">{ag.status}</span>
                  </div>
                  <p className="text-sm text-ink/70">Saw: {ag.saw}</p>
                  {ag.actions.map((a) => (
                    <div key={a.id} className="mt-3 border-t border-leaf-100 pt-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold">{KIND[a.kind] ?? a.kind} · {a.zone}</div>
                        {a.kind !== 'alert' && <VerdictStamp verdict={a.state === 'vetoed' ? 'veto' : a.state === 'dispatched' ? 'allow' : verdictOf({ verdict: a.verdict ?? 'allow', needs_human: a.needs_human })} className="text-sm" />}
                      </div>
                      <div className="text-sm text-ink/80">{params(a.params)}</div>
                      <div className="text-sm"><span className="text-ink/60">Why: </span>{a.why}</div>
                      {a.verdict_reason && <div className="text-sm"><span className="text-ink/60">Safety engine: </span>{a.verdict_reason}</div>}
                      <div className="mt-1 text-sm font-semibold text-leaf-800">{STATE[a.state] ?? a.state}</div>
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          </div>
        )}
      </Step>

      <Step n={3} title="Approve and send to the pump or dispenser">
        {!report || !o?.awaiting_approval ? (
          <p className="text-sm text-ink/60">{report ? 'Nothing is waiting for approval.' : 'Run the automation first.'}</p>
        ) : approver ? (
          <div className="flex gap-2">
            <Button onClick={() => approve('approve')} disabled={!!busy}>Approve and dispatch</Button>
            <Button variant="secondary" className="text-veto" onClick={() => approve('reject')} disabled={!!busy}>Reject</Button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-human">Only an agronomist or admin can approve. Sign in with one of those demo roles.</p>
        )}
        {report && report.hardware_queue.length > 0 && (
          <Card className="mt-4">
            <div className="font-display text-lg font-bold text-leaf-950">Hardware command queue (in Firebase)</div>
            <ul className="mt-2 space-y-2">
              {report.hardware_queue.map((c) => (
                <li key={c.action_id} className="rounded-lg bg-leaf-50 p-3 text-sm">
                  <div className="font-semibold">{c.device} · {c.zone} · {params(c.params)}</div>
                  <div className="text-human">Status: {c.status}. {c.status_note}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </Step>
    </>
  );
};
