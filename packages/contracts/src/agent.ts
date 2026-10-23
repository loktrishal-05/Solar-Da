import { z } from 'zod';

// Agent-layer contracts shared with the Python services (see docs/BLUEPRINT.md).
// Every sensor value carries a source tag; replayed data is never presented as field data.

export const SourceTag = z.enum(['replay', 'simulated', 'twin']);

export const TelemetryEventSchema = z.object({
  ts: z.string().datetime(), // replay clock, never wall clock
  siteId: z.string(),
  zone: z.string(),
  metric: z.string(),
  value: z.number(),
  unit: z.string(),
  quality: z.enum(['ok', 'suspect', 'bad']),
  source: SourceTag,
});

export const ProposedActionSchema = z.object({
  id: z.string(),
  kind: z.enum(['irrigate', 'dose_ph', 'dose_nutrient', 'ventilate', 'shade', 'treat_disease', 'alert', 'no_op']),
  zone: z.string(),
  params: z.record(z.unknown()),
  rationale: z.string(),
  evidence: z.array(z.string()), // telemetry ids, forecast ids, image ids, source doc ids
  expected_effect: z.string(), // what verify will check
  confidence: z.number().min(0).max(1),
});

export const SafetyVerdictSchema = z.object({
  proposal_id: z.string(),
  verdict: z.enum(['allow', 'modify', 'veto']),
  reason: z.string(),
  invariant: z.string().optional(), // name of the rule that decided
  needs_human: z.boolean(),
  modified_params: z.record(z.unknown()).optional(),
});

export const ApprovalSchema = z.object({
  proposal_id: z.string(),
  decision: z.enum(['approve', 'reject']),
  decided_by: z.string(),
  ts: z.string().datetime(),
  note: z.string().optional(),
});

export const TraceEntrySchema = z.object({
  run_id: z.string(),
  node: z.string(),
  ts: z.string().datetime(),
  summary: z.string(),
  data: z.record(z.unknown()).optional(),
});

export const agentSchemas = {
  TelemetryEvent: TelemetryEventSchema,
  ProposedAction: ProposedActionSchema,
  SafetyVerdict: SafetyVerdictSchema,
  Approval: ApprovalSchema,
  TraceEntry: TraceEntrySchema,
};

export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type ProposedAction = z.infer<typeof ProposedActionSchema>;
export type SafetyVerdict = z.infer<typeof SafetyVerdictSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type TraceEntry = z.infer<typeof TraceEntrySchema>;
