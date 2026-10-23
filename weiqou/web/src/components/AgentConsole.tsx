import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdvisorPanel } from './AdvisorPanel';
import { BenchmarkPage } from './BenchmarkPage';
import { AlertTriangle, CheckCircle2, ChevronDown, ChevronRight, Pause, Play, Radio, ShieldCheck, ShieldX, XCircle } from 'lucide-react';

// Agent Console: replay controls, live (replayed) feed, per-node reasoning trace, approvals inbox.
// Talks to the Python agent runtime through the Vite proxy at /agents.

const AGENTS = '/agents';

type Telemetry = { ts: string; zone: string; metric: string; value: number; unit: string; source: string };
type TraceEntry = { run_id: string; node: string; ts: string; summary: string; data?: Record<string, any> };
type ApprovalRequest = { type: string; run_id: string; sim_time: string; actions: { verdict: any; action: any }[] };
type SessionInfo = {
  session_id: string | null; scenario?: string; description?: string; dataset?: string; speed?: number;
  paused?: boolean; sim_time?: string; start?: string; end?: string; autonomy?: string; finished?: boolean;
};
type Scenario = { name: string; description: string; start: string; end: string; autonomy: string };

const post = (path: string, body?: unknown) =>
  fetch(AGENTS + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });

const NODE_ORDER = ['ingest', 'assess', 'irrigation', 'fertigation', 'climate', 'disease', 'arbiter', 'safety_gate', 'human_approval', 'dispatch', 'verify', 'audit'];

const sourceStyle = (s: string) =>
  s === 'replay' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-violet-50 text-violet-800 border-violet-200';

export const AgentConsole: React.FC<{ eStopActive: boolean; onToggleEStop: () => void }> = ({ eStopActive, onToggleEStop }) => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenario, setScenario] = useState('heatwave');
  const [speed, setSpeed] = useState(60);
  const [autonomy, setAutonomy] = useState('auto_in_envelope');
  const [session, setSession] = useState<SessionInfo>({ session_id: null });
  const [feed, setFeed] = useState<Record<string, Telemetry>>({});
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [approvals, setApprovals] = useState<Record<string, ApprovalRequest>>({});
  const [openRun, setOpenRun] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'console' | 'advisor' | 'benchmark'>('console');
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch(AGENTS + '/scenarios').then((r) => r.json()).then(setScenarios).catch(() => setError('Agent runtime not reachable on :8000. Start it with: services/agents/.venv/Scripts/python -m uvicorn app.main:app --port 8000'));
    fetch(AGENTS + '/replay/state').then((r) => r.json()).then(setSession).catch(() => {});
    fetch(AGENTS + '/runs').then((r) => r.json()).then((runs: Record<string, any>) => {
      const pending: Record<string, ApprovalRequest> = {};
      Object.entries(runs).forEach(([id, r]) => { if (r.status === 'awaiting_approval' && r.approval_request) pending[id] = r.approval_request; });
      setApprovals(pending);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const es = new EventSource(AGENTS + '/replay/stream');
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener('telemetry', (e) => {
      const d = JSON.parse((e as MessageEvent).data);
      setFeed((prev) => {
        const next = { ...prev };
        d.events.forEach((t: Telemetry) => { next[`${t.zone}.${t.metric}`] = t; });
        return next;
      });
    });
    es.addEventListener('trace', (e) => {
      const t = JSON.parse((e as MessageEvent).data) as TraceEntry;
      setTrace((prev) => [...prev.slice(-1500), t]);
    });
    es.addEventListener('approval_request', (e) => {
      const r = JSON.parse((e as MessageEvent).data) as ApprovalRequest;
      setApprovals((prev) => ({ ...prev, [r.run_id]: r }));
    });
    es.addEventListener('clock', (e) => setSession(JSON.parse((e as MessageEvent).data)));
    es.addEventListener('agent_error', (e) => {
      const data = (e as MessageEvent).data;
      if (data) setError(JSON.parse(data).message);
    });
    return () => es.close();
  }, []);

  const start = async () => {
    setError(null); setTrace([]); setFeed({});
    const r = await post('/replay/start', { scenario, speed, autonomy });
    if (!r.ok) setError((await r.json()).detail ?? 'could not start');
    else setSession(await r.json());
  };
  const pause = async () => setSession(await (await post(`/replay/pause?paused=${!session.paused}`)).json());
  const changeSpeed = async (s: number) => {
    setSpeed(s);
    if (session.session_id) setSession(await (await post(`/replay/speed?speed=${s}`)).json());
  };
  const seek = async (frac: number) => {
    if (!session.start || !session.end) return;
    const a = Date.parse(session.start), b = Date.parse(session.end);
    const ts = new Date(a + (b - a) * frac).toISOString().replace(/\.\d+Z$/, 'Z');
    setSession(await (await post('/replay/seek', { ts })).json());
  };

  const decide = useCallback(async (req: ApprovalRequest, decision: 'approve' | 'reject') => {
    const approvals = req.actions.map((a) => ({ proposal_id: a.action.id, decision, decided_by: 'farmer (console)', ts: req.sim_time }));
    const r = await post(`/runs/${encodeURIComponent(req.run_id)}/resume`, { approvals });
    if (r.ok) setApprovals((prev) => { const n = { ...prev }; delete n[req.run_id]; return n; });
    else setError((await r.json()).detail ?? 'resume failed');
  }, []);

  const runs = useMemo(() => {
    const m = new Map<string, TraceEntry[]>();
    trace.forEach((t) => m.set(t.run_id, [...(m.get(t.run_id) ?? []), t]));
    return [...m.entries()].reverse();
  }, [trace]);

  const progress = session.start && session.end && session.sim_time
    ? (Date.parse(session.sim_time) - Date.parse(session.start)) / (Date.parse(session.end) - Date.parse(session.start)) : 0;

  const zones = useMemo(() => {
    const z: Record<string, Telemetry[]> = {};
    Object.values(feed).forEach((t) => { (z[t.zone] ??= []).push(t); });
    Object.values(z).forEach((l) => l.sort((a, b) => a.metric.localeCompare(b.metric)));
    return z;
  }, [feed]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-5 text-[#1A1A1A]">
      {/* Replay badge: permanent, never hidden */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900">
        <Radio className="w-4 h-4" />
        <span className="font-black uppercase tracking-wide">Replay mode</span>
        <span>No live sensors. Values are replayed from public datasets ({session.dataset ?? 'EDEN ISS 2020, HydroGrowNet'}) or simulated, and each value carries its source tag.</span>
        <span className={`ml-auto font-mono px-2 py-0.5 rounded-full border ${connected ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-gray-300 text-gray-500 bg-white'}`}>
          {connected ? 'stream connected' : 'stream offline'}
        </span>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-800 font-mono">{error}</div>}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {([['console', 'Agent console'], ['advisor', 'Farmer advisor (தமிழ்)'], ['benchmark', 'Benchmark']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-full border font-bold ${tab === k ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-white'}`}>{label}</button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-gray-600">
          <input type="checkbox" checked={lowBandwidth} onChange={(e) => setLowBandwidth(e.target.checked)} /> Low-bandwidth mode (no charts or voice)
        </label>
      </div>

      {tab === 'advisor' && <AdvisorPanel lowBandwidth={lowBandwidth} />}
      {tab === 'benchmark' && <BenchmarkPage lowBandwidth={lowBandwidth} />}
      {tab === 'console' && (<>

      {/* Replay controls */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-end gap-3 text-xs">
          <label className="flex flex-col gap-1 font-semibold">Scenario
            <select value={scenario} onChange={(e) => setScenario(e.target.value)} className="border rounded-lg px-2 py-1.5 font-mono">
              {(scenarios.length ? scenarios : [{ name: 'heatwave' } as Scenario]).map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 font-semibold">Speed
            <div className="flex rounded-lg border overflow-hidden font-mono">
              {[1, 60, 1440].map((s) => (
                <button key={s} onClick={() => changeSpeed(s)} className={`px-3 py-1.5 ${(session.speed ?? speed) === s ? 'bg-[#1B4332] text-white' : 'bg-white hover:bg-gray-50'}`}>{s}x</button>
              ))}
            </div>
          </label>
          <label className="flex flex-col gap-1 font-semibold">Autonomy tier
            <select value={autonomy} onChange={(e) => setAutonomy(e.target.value)} className="border rounded-lg px-2 py-1.5 font-mono">
              <option value="advise">L0 advise</option>
              <option value="propose">L1 propose (human approves each)</option>
              <option value="auto_in_envelope">L2 act in envelope</option>
            </select>
          </label>
          <button onClick={start} className="px-4 py-2 rounded-full bg-[#1B4332] text-white font-bold flex items-center gap-1.5"><Play className="w-3.5 h-3.5" /> Start</button>
          <button onClick={pause} disabled={!session.session_id} className="px-4 py-2 rounded-full border font-bold flex items-center gap-1.5 disabled:opacity-40">
            {session.paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />} {session.paused ? 'Resume' : 'Pause'}
          </button>
          <button onClick={onToggleEStop} className={`ml-auto px-4 py-2 rounded-full font-black flex items-center gap-1.5 ${eStopActive ? 'bg-red-600 text-white animate-pulse' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertTriangle className="w-3.5 h-3.5" /> {eStopActive ? 'E-STOP ACTIVE (click to clear)' : 'E-STOP'}
          </button>
        </div>
        {scenarios.find((s) => s.name === scenario)?.description && (
          <p className="text-xs text-gray-600">{scenarios.find((s) => s.name === scenario)!.description}</p>
        )}
        <div className="flex items-center gap-3 text-[11px] font-mono text-gray-600">
          <span>{session.start?.slice(0, 16).replace('T', ' ') ?? '—'}</span>
          <input type="range" min={0} max={1000} value={Math.round(progress * 1000)} disabled={!session.session_id}
                 onChange={(e) => seek(Number(e.target.value) / 1000)} className="flex-1 accent-[#1B4332]" aria-label="Seek replay" />
          <span>{session.end?.slice(0, 16).replace('T', ' ') ?? '—'}</span>
        </div>
        <div className="text-xs font-mono">
          sim time <b>{session.sim_time?.replace('T', ' ').replace('Z', ' UTC') ?? '—'}</b>
          {session.session_id && <> · session {session.session_id} · {session.speed}x · {session.autonomy}{session.finished ? ' · finished' : ''}</>}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Live feed */}
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#1B4332] mb-3">Live feed (replayed)</h3>
          {!Object.keys(zones).length && <p className="text-xs text-gray-500">Start a scenario to stream readings.</p>}
          <div className="space-y-3">
            {Object.entries(zones).map(([zone, list]) => (
              <div key={zone}>
                <div className="text-[11px] font-bold font-mono text-gray-700 mb-1">{zone}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {list.map((t) => (
                    <div key={t.metric} className="rounded-lg border border-gray-100 px-2 py-1.5">
                      <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                        <span>{t.metric}</span>
                        <span className={`px-1.5 rounded-full border ${sourceStyle(t.source)}`}>{t.source}</span>
                      </div>
                      <div className="font-mono text-sm font-bold">{t.value === -9.99 ? 'missing' : Number(t.value.toFixed(2))} <span className="text-[10px] font-normal text-gray-500">{t.unit}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trace */}
        <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#1B4332] mb-3">Reasoning trace (one entry per graph node)</h3>
          {!runs.length && <p className="text-xs text-gray-500">Each farm-shift run appears here: ingest → assess → specialists → arbiter → safety gate → approval → dispatch → verify → audit.</p>}
          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {runs.map(([runId, entries]) => {
              const gate = entries.find((e) => e.node === 'safety_gate');
              const vetoed = gate?.data?.verdicts?.some((v: any) => v.verdict === 'veto');
              const open = openRun === runId;
              return (
                <div key={runId} className="rounded-xl border border-gray-200">
                  <button onClick={() => setOpenRun(open ? null : runId)} className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs">
                    {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span className="font-mono font-bold">{runId}</span>
                    <span className="font-mono text-gray-500">{entries[0]?.ts.slice(11, 16)}</span>
                    {vetoed && <span className="px-2 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold flex items-center gap-1"><ShieldX className="w-3 h-3" /> veto</span>}
                    <span className="truncate text-gray-600">{entries[entries.length - 1]?.summary}</span>
                  </button>
                  {open && (
                    <ol className="border-t border-gray-100 px-3 py-2 space-y-1.5">
                      {[...entries].sort((a, b) => NODE_ORDER.indexOf(a.node) - NODE_ORDER.indexOf(b.node)).map((e, i) => (
                        <li key={i} className="text-xs">
                          <div className="flex gap-2"><span className="font-mono font-bold text-[#1B4332] w-28 shrink-0">{e.node}</span><span>{e.summary}</span></div>
                          {e.node === 'safety_gate' && e.data?.verdicts?.map((v: any) => (
                            <div key={v.proposal_id} className={`ml-28 mt-1 rounded-lg px-2 py-1 font-mono text-[11px] border ${v.verdict === 'veto' ? 'bg-red-50 border-red-200 text-red-800' : v.verdict === 'modify' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                              {v.verdict.toUpperCase()} {v.invariant ? `[${v.invariant}] ` : ''}{v.reason}{v.needs_human ? ' · needs human' : ''}
                            </div>
                          ))}
                          {e.node === 'arbiter' && (e.data?.plan?.length ?? 0) > 0 && (
                            <div className="ml-28 mt-1 font-mono text-[11px] text-gray-600">{e.data!.plan.map((p: any) => `${p.kind}@${p.zone} ${JSON.stringify(p.params)}`).join(' · ')}</div>
                          )}
                          {e.node === 'arbiter' && [...(e.data?.plan ?? []), ...(e.data?.holds ?? [])].filter((p: any) => p.params?.options?.length).map((p: any, k: number) => (
                            <div key={k} className="ml-28 mt-1 rounded-lg border border-sky-200 bg-sky-50 p-2 text-[11px]">
                              <div className="text-gray-700 mb-1">{p.rationale?.split('Twin')[0]}</div>
                              <table className="font-mono w-full">
                                <thead><tr className="text-left text-gray-500"><th>twin option</th><th>stress days</th><th>biomass</th><th>water mm</th><th>run id</th></tr></thead>
                                <tbody>{p.params.options.map((o: any) => (
                                  <tr key={o.option} className={p.params.decision === 'hold' ? (o.option === 'hold' ? 'font-bold' : '') : (o.option === `irrigate_${p.params.when}` ? 'font-bold' : '')}>
                                    <td>{o.option}</td><td>{o.stress_days}</td><td>{o.biomass}</td><td>{o.water_used_mm}</td><td className="text-gray-500">{o.run_id}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          ))}
                          {e.node === 'arbiter' && (e.data?.holds ?? []).filter((p: any) => !p.params?.options?.length).map((p: any, k: number) => (
                            <div key={'h' + k} className="ml-28 mt-1 font-mono text-[11px] text-sky-800">{p.zone}: {p.rationale}</div>
                          ))}
                          {e.node === 'ingest' &&(e.data?.flags?.length ?? 0) > 0 && (
                            <div className="ml-28 mt-1 font-mono text-[11px] text-amber-800">{e.data!.flags.map((f: any) => `${f.zone}.${f.metric}: ${f.check} (${f.detail})`).join(' · ')}</div>
                          )}
                          {e.node === 'audit' && e.data?.summary_ta && <div className="ml-28 mt-1 text-[11px] text-gray-600">{e.data.summary_ta}</div>}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Approvals inbox */}
      <section className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#1B4332] mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Approvals inbox ({Object.keys(approvals).length})
        </h3>
        {!Object.keys(approvals).length && <p className="text-xs text-gray-500">Nothing waiting. Pesticide/treatment actions, large doses and every action in the L1 tier pause here for a human.</p>}
        <div className="grid md:grid-cols-2 gap-3">
          {Object.values(approvals).map((req) => (
            <div key={req.run_id} className="rounded-xl border border-amber-300 bg-amber-50/50 p-3 text-xs space-y-2">
              <div className="font-mono font-bold">{req.run_id} · sim {req.sim_time.slice(11, 16)}</div>
              {req.actions.map(({ action, verdict }) => (
                <div key={action.id} className="rounded-lg bg-white border p-2">
                  <div className="font-bold">{action.kind} @ {action.zone} <span className="font-mono font-normal">{JSON.stringify(verdict.modified_params ?? action.params)}</span></div>
                  <div className="text-gray-600">{action.rationale}</div>
                  <div className="text-[11px] font-mono text-gray-500">expects: {action.expected_effect} · safety: {verdict.verdict} ({verdict.reason})</div>
                </div>
              ))}
              <div className="flex gap-2">
                <button onClick={() => decide(req, 'approve')} className="px-3 py-1.5 rounded-full bg-[#1B4332] text-white font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Approve</button>
                <button onClick={() => decide(req, 'reject')} className="px-3 py-1.5 rounded-full border border-red-200 text-red-700 font-bold flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </>)}
    </div>
  );
};
