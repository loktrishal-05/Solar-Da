import { evaluateSafetyInterlocks } from './interlocks.js';
import { ActuatorCommandProposal, ReservoirSafetyLimits, TelemetryReading } from './types.js';

// Safety gate for agent proposals (POST /api/safety/check). The LLM only proposes; this decides.
// Mirrors the ProposedAction / SafetyVerdict contracts in @terrasub-solarda/contracts
// (structural copy so the engine keeps zero dependencies).

export type AgentActionKind =
  | 'irrigate' | 'dose_ph' | 'dose_nutrient' | 'ventilate' | 'shade' | 'treat_disease' | 'alert' | 'no_op';

export interface AgentProposal {
  id: string;
  kind: AgentActionKind;
  zone: string;
  params: Record<string, unknown>;
  rationale: string;
  evidence: string[];
  expected_effect: string;
  confidence: number;
}

export interface AgentVerdict {
  proposal_id: string;
  verdict: 'allow' | 'modify' | 'veto';
  reason: string;
  invariant?: string;
  needs_human: boolean;
  modified_params?: Record<string, unknown>;
}

export type AutonomyTier = 'advise' | 'propose' | 'auto_in_envelope';

export interface DispatchedRecord {
  kind: AgentActionKind;
  zone: string;
  atMs: number; // replay clock
  minutes?: number;
  ml?: number;
}

export interface AgentSafetyContext {
  nowMs: number; // replay clock, never wall clock
  autonomy: AutonomyTier;
  eStopActive: boolean;
  limits: ReservoirSafetyLimits;
  telemetry: TelemetryReading; // zone snapshot used for the existing interlocks
  badMetrics: string[]; // metrics flagged `bad` by the ingest quality checks for this zone
  rainNextWindowMm?: number;
  history: DispatchedRecord[]; // dispatched actions, from the API action log
}

// Envelope numbers. ponytail: placeholders until the crop/substrate recipes give sourced values;
// each is tagged so the UI and audit can show it is unverified.
export const ENVELOPE = {
  maxIrrigationMinPerZonePerDay: { value: 60, source: 'UNVERIFIED placeholder (needs substrate recipe)' },
  minIrrigationGapMin: { value: 120, source: 'UNVERIFIED placeholder (needs substrate recipe)' },
  maxDoseMlPerHour: { value: 50, source: 'UNVERIFIED placeholder (needs dosing recipe)' },
  rainHoldMm: { value: 5, source: 'UNVERIFIED placeholder (FAO-56 effective rain to be sourced in Phase 2)' },
  humanApprovalDoseMl: { value: 20, source: 'UNVERIFIED placeholder' },
};

// Which reading each action depends on; acting on a bad reading is vetoed (envelope rule 3).
const DEPENDS_ON: Record<AgentActionKind, string[]> = {
  irrigate: ['soil_moisture', 'level'],
  dose_ph: ['ph', 'ec', 'level'],
  dose_nutrient: ['ec', 'ph', 'level'],
  ventilate: ['air_temp', 'rh', 'vpd'],
  shade: ['air_temp', 'par'],
  treat_disease: [],
  alert: [],
  no_op: [],
};

const ACTUATOR: Partial<Record<AgentActionKind, ActuatorCommandProposal['actuatorType']>> = {
  irrigate: 'WATER_PUMP',
  dose_ph: 'PH_DOWN_PUMP',
  dose_nutrient: 'NUTRIENT_DOSE_PUMP',
  ventilate: 'FAN_VENT',
  shade: 'LIGHTING',
};

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const HOUR = 3_600_000;

export function checkAgentProposal(p: AgentProposal, ctx: AgentSafetyContext): AgentVerdict {
  const veto = (invariant: string, reason: string): AgentVerdict => ({
    proposal_id: p.id, verdict: 'veto', invariant, reason, needs_human: false,
  });

  // Rule 6: E-STOP freezes dispatch, whatever the action.
  if (ctx.eStopActive && p.kind !== 'alert' && p.kind !== 'no_op') {
    return veto('SYSTEM_ESTOP_ACTIVE', 'E-STOP is active; dispatch is frozen.');
  }
  if (p.kind === 'alert' || p.kind === 'no_op') {
    return { proposal_id: p.id, verdict: 'allow', reason: 'No actuator involved.', needs_human: false };
  }
  if (ctx.autonomy === 'advise') {
    return veto('AUTONOMY_ADVISE_ONLY', 'Autonomy tier L0 (advise): the agent may explain but not act.');
  }

  // Rule 3: no action on a reading flagged bad.
  const bad = DEPENDS_ON[p.kind].filter((m) => ctx.badMetrics.includes(m));
  if (bad.length) return veto('BAD_READING', `Depends on reading(s) flagged bad: ${bad.join(', ')}.`);

  // A pH dose must move pH back toward the window, never further out.
  if (p.kind === 'dose_ph') {
    const up = p.params.direction === 'up';
    if ((up && ctx.telemetry.ph > ctx.limits.phMax) || (!up && ctx.telemetry.ph < ctx.limits.phMin)) {
      return veto('PH_WRONG_DIRECTION', `pH ${ctx.telemetry.ph} is already outside [${ctx.limits.phMin}, ${ctx.limits.phMax}] on the side this dose pushes toward.`);
    }
  }

  // Existing engine invariants (pH/EC ceilings, mixing delay, 24h dose, level, DO, temp...).
  const actuatorType = ACTUATOR[p.kind];
  if (actuatorType) {
    const direction = p.params.direction === 'up' ? 'PH_UP_PUMP' : actuatorType;
    const ml = num(p.params.ml);
    const lastDose = Math.max(0, ...ctx.history.filter((h) => h.kind.startsWith('dose') && h.zone === p.zone).map((h) => h.atMs));
    const dosed24h = ctx.history
      .filter((h) => h.kind.startsWith('dose') && h.zone === p.zone && ctx.nowMs - h.atMs < 24 * HOUR)
      .reduce((s, h) => s + (h.ml ?? 0), 0);
    const legacy: ActuatorCommandProposal = {
      id: p.id,
      reservoirGroupId: p.zone,
      actuatorType: direction,
      targetValue: p.kind.startsWith('dose') ? ml : num(p.params.minutes) * 60,
      unit: p.kind.startsWith('dose') ? 'ML' : 'SEC',
      reason: p.rationale,
      idempotencyKey: p.id,
      expiresAtMs: ctx.nowMs + 30 * 60_000,
      requiresHumanConfirmation: false, // human approval is routed by needs_human below
      proposedBy: 'AUTOMATION_RULE',
      autonomyLevel: 'L3_AUTO_CHEMISTRY',
    };
    const r = evaluateSafetyInterlocks(legacy, ctx.telemetry, ctx.limits,
      { eStopActive: ctx.eStopActive, lastDoseTimestampMs: lastDose, cumulative24hDoseMl: dosed24h, harvestBlockActiveUntilMs: 0 },
      ctx.nowMs);
    // A pH correction is the remedy for an out-of-band pH, so that one interlock must not block it.
    const reasons = r.vetoReasons.filter((v) => !(p.kind === 'dose_ph' && v.startsWith('PH_OUT_OF_BOUNDS')));
    if (reasons.length) return veto(reasons[0].split(':')[0], reasons.join(' '));
  }

  let modified: Record<string, unknown> | undefined;
  if (p.kind === 'irrigate') {
    const mins = num(p.params.minutes);
    const today = ctx.history.filter((h) => h.kind === 'irrigate' && h.zone === p.zone && ctx.nowMs - h.atMs < 24 * HOUR);
    const last = Math.max(0, ...today.map((h) => h.atMs));
    // Rule 4: hold irrigation when rain is forecast.
    if ((ctx.rainNextWindowMm ?? 0) >= ENVELOPE.rainHoldMm.value) {
      return veto('RAIN_HOLD', `Forecast rain ${ctx.rainNextWindowMm} mm >= ${ENVELOPE.rainHoldMm.value} mm in the next window.`);
    }
    // Rule 1: daily cap and minimum gap.
    if (last && ctx.nowMs - last < ENVELOPE.minIrrigationGapMin.value * 60_000) {
      return veto('IRRIGATION_MIN_GAP', `Last irrigation ${Math.round((ctx.nowMs - last) / 60_000)} min ago; minimum gap ${ENVELOPE.minIrrigationGapMin.value} min.`);
    }
    const left = ENVELOPE.maxIrrigationMinPerZonePerDay.value - today.reduce((s, h) => s + (h.minutes ?? 0), 0);
    if (left <= 0) return veto('IRRIGATION_DAILY_CAP', 'Daily irrigation cap for this zone is used up.');
    if (mins > left) modified = { ...p.params, minutes: left };
  }

  if (p.kind === 'dose_ph' || p.kind === 'dose_nutrient') {
    // Rule 2: max dose per hour.
    const lastHour = ctx.history
      .filter((h) => h.kind === p.kind && h.zone === p.zone && ctx.nowMs - h.atMs < HOUR)
      .reduce((s, h) => s + (h.ml ?? 0), 0);
    if (lastHour + num(p.params.ml) > ENVELOPE.maxDoseMlPerHour.value) {
      return veto('MAX_DOSE_PER_HOUR', `${lastHour} ml dosed in the last hour + ${num(p.params.ml)} ml > ${ENVELOPE.maxDoseMlPerHour.value} ml.`);
    }
  }

  // Rule 5 and tiers: who has to approve.
  const needsHuman =
    p.kind === 'treat_disease' ||
    ctx.autonomy === 'propose' ||
    (p.kind.startsWith('dose') && num(p.params.ml) > ENVELOPE.humanApprovalDoseMl.value);

  return modified
    ? { proposal_id: p.id, verdict: 'modify', invariant: 'IRRIGATION_DAILY_CAP', reason: `Reduced to the ${modified.minutes} min left in today's cap.`, needs_human: needsHuman, modified_params: modified }
    : { proposal_id: p.id, verdict: 'allow', reason: 'Inside the safety envelope.', needs_human: needsHuman };
}
