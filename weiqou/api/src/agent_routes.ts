import { Router, Request, Response } from 'express';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { checkAgentProposal, AgentVerdict, DispatchedRecord } from '@terrasub-solarda/engine';
import { ProposedActionSchema, ApprovalSchema } from '@terrasub-solarda/contracts';
import { store } from './store.js';

// Agent-layer endpoints (docs/BLUEPRINT.md, Phase 1). The Python agent runtime calls these;
// it never re-implements the invariants.

const RUNTIME_DIR = process.env.SOLARDA_RUNTIME_DIR ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../../data/runtime');
mkdirSync(RUNTIME_DIR, { recursive: true });
const AUDIT_FILE = resolve(RUNTIME_DIR, 'audit.jsonl');
const ACTIONS_FILE = resolve(RUNTIME_DIR, 'actions.jsonl');

const readJsonl = (f: string): any[] =>
  existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];

// Append-only: there is no update or delete route for either log.
export function appendAudit(entry: Record<string, unknown>) {
  appendFileSync(AUDIT_FILE, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
}

// Verdicts issued by /safety/check; /actions refuses anything without one.
const verdicts = new Map<string, AgentVerdict & { ctx: SafetyRequest['context'] }>();

const ZoneSnapshot = z.object({
  ph: z.number().optional(), ec: z.number().optional(), solution_temp: z.number().optional(),
  level_mm: z.number().optional(), do_mg_l: z.number().optional(),
});
const SafetyRequestSchema = z.object({
  proposals: z.array(ProposedActionSchema),
  context: z.object({
    sim_time: z.string().datetime(),
    autonomy: z.enum(['advise', 'propose', 'auto_in_envelope']),
    crop: z.string().default('Butterhead Lettuce'),
    zones: z.record(ZoneSnapshot).default({}),
    bad_metrics: z.record(z.array(z.string())).default({}),
    rain_next_window_mm: z.number().optional(),
  }),
});
type SafetyRequest = z.infer<typeof SafetyRequestSchema>;

// Verdicts survive an API restart through the append-only audit log.
function verdictFromAudit(proposalId: string) {
  const e = readJsonl(AUDIT_FILE).filter((x) => x.type === 'verdict' && x.proposal?.id === proposalId).pop();
  return e ? { ...(e.verdict as AgentVerdict), ctx: e.context as SafetyRequest['context'] } : undefined;
}

const history = (): DispatchedRecord[] =>
  readJsonl(ACTIONS_FILE).map((a) => ({
    kind: a.action.kind, zone: a.action.zone, atMs: Date.parse(a.sim_time),
    minutes: a.action.params.minutes, ml: a.action.params.ml,
  }));

function check(action: z.infer<typeof ProposedActionSchema>, ctx: SafetyRequest['context']): AgentVerdict {
  const limits = store.limits[ctx.crop] ?? store.limits['Butterhead Lettuce'];
  const z0 = ctx.zones[action.zone] ?? {};
  const nowMs = Date.parse(ctx.sim_time);
  return checkAgentProposal(action as any, {
    nowMs,
    autonomy: ctx.autonomy,
    eStopActive: store.eStopActive,
    limits,
    telemetry: {
      timestampMs: nowMs, ph: z0.ph ?? (limits.phMin + limits.phMax) / 2, ecMsCm: z0.ec ?? limits.ecMinMsCm,
      solutionTempC: z0.solution_temp, levelMm: z0.level_mm, doMgL: z0.do_mg_l, qualityStatus: 'VALID',
    },
    badMetrics: ctx.bad_metrics[action.zone] ?? [],
    rainNextWindowMm: ctx.rain_next_window_mm,
    history: history(),
  });
}

// Simulated plant response to an applied action. Values are labelled `simulated`, never field data.
// ponytail: fixed linear gains; replace with the engine/twin models in Phase 2.
function simulatedEffect(a: z.infer<typeof ProposedActionSchema>) {
  const p = a.params as Record<string, number | string>;
  switch (a.kind) {
    case 'dose_ph': return { metric: 'ph', delta: (p.direction === 'up' ? 1 : -1) * 0.03 * Number(p.ml ?? 0) };
    case 'dose_nutrient': return { metric: 'ec', delta: 0.01 * Number(p.ml ?? 0) };
    case 'ventilate': return { metric: 'air_temp', delta: -0.04 * Number(p.pct ?? 50) };
    case 'shade': return { metric: 'air_temp', delta: -0.02 * Number(p.pct ?? 50) };
    case 'irrigate': return { metric: 'soil_moisture', delta: 0.5 * Number(p.minutes ?? 0) };
    default: return null;
  }
}

export const agentRouter = Router();

agentRouter.post('/safety/check', (req: Request, res: Response) => {
  const parse = SafetyRequestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });
  const { proposals, context } = parse.data;
  const out = proposals.map((p) => {
    const v = check(p, context);
    verdicts.set(p.id, { ...v, ctx: context });
    appendAudit({ type: 'verdict', sim_time: context.sim_time, proposal: p, verdict: v, context });
    return v;
  });
  res.json({ verdicts: out, estop: store.eStopActive });
});

const ActionRequestSchema = z.object({
  run_id: z.string(),
  sim_time: z.string().datetime(),
  action: ProposedActionSchema,
  approval: ApprovalSchema.optional(),
});

agentRouter.post('/actions', (req: Request, res: Response) => {
  const key = req.header('Idempotency-Key');
  if (!key) return res.status(400).json({ error: 'Idempotency-Key header is required' });
  const prior = readJsonl(ACTIONS_FILE).find((a) => a.idempotency_key === key);
  if (prior) return res.json({ ...prior, replayed: true }); // a resumed run never repeats a dispatch

  const parse = ActionRequestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });
  const { run_id, sim_time, action, approval } = parse.data;

  const v = verdicts.get(action.id) ?? verdictFromAudit(action.id);
  if (!v) return res.status(409).json({ error: 'No safety verdict for this proposal; call /api/safety/check first.' });
  if (v.verdict === 'veto') return res.status(422).json({ error: 'Vetoed', verdict: v });
  if (v.needs_human && approval?.decision !== 'approve') {
    return res.status(403).json({ error: 'Human approval required', verdict: v });
  }
  // Re-check at dispatch (E-STOP or new history since the verdict), as the existing pipeline does.
  const recheck = check({ ...action, params: v.modified_params ?? action.params }, { ...v.ctx, sim_time });
  if (recheck.verdict === 'veto') {
    appendAudit({ type: 'dispatch_vetoed', run_id, sim_time, proposal_id: action.id, verdict: recheck });
    return res.status(422).json({ error: 'Vetoed at dispatch', verdict: recheck });
  }

  const applied = { ...action, params: v.modified_params ?? action.params };
  const record = {
    idempotency_key: key, run_id, sim_time, action: applied, approval: approval ?? null,
    status: 'dispatched', effect: simulatedEffect(applied), source: 'simulated',
  };
  appendFileSync(ACTIONS_FILE, JSON.stringify(record) + '\n');
  appendAudit({ type: 'dispatched', run_id, sim_time, proposal_id: action.id, effect: record.effect });
  res.status(201).json(record);
});

agentRouter.get('/actions', (_req: Request, res: Response) => res.json({ actions: readJsonl(ACTIONS_FILE) }));

agentRouter.post('/audit', (req: Request, res: Response) => {
  appendAudit({ type: 'agent', ...req.body });
  res.status(201).json({ ok: true });
});

agentRouter.get('/audit', (req: Request, res: Response) => {
  const runId = req.query.run_id;
  const entries = readJsonl(AUDIT_FILE).filter((e) => !runId || e.run_id === runId);
  res.json({ entries });
});
