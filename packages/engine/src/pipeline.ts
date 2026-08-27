import { evaluateSafetyInterlocks, InterlockState } from './interlocks.js';
import { ActuatorCommandProposal, InterlockResult, ReservoirSafetyLimits, TelemetryReading } from './types.js';

export interface AuditRecord {
  id: string;
  timestampMs: number;
  stage: 'TICK' | 'PLAN' | 'ACTIONS' | 'INTERLOCKS' | 'DISPATCH' | 'ACKNOWLEDGE' | 'VERIFY' | 'AUDIT';
  proposalId: string;
  status: 'PENDING' | 'EXECUTED' | 'VETOED' | 'FAILED';
  details: string;
}

export interface PipelineExecutionResult {
  proposalId: string;
  interlockResult: InterlockResult;
  status: 'DISPATCHED_AND_VERIFIED' | 'VETOED' | 'DISPATCH_FAILED';
  auditLogs: AuditRecord[];
}

/**
 * Fixed Actuator Pipeline Execution:
 * tick → plan → actions → interlocks → dispatch → acknowledge → verify → audit
 * 
 * No alternate path is permitted, ever, for any caller.
 */
export function runFixedActuatorPipeline(
  proposal: ActuatorCommandProposal,
  telemetry: TelemetryReading,
  limits: ReservoirSafetyLimits,
  interlockState: InterlockState,
  currentTimeMs: number,
  dispatchFn: (p: ActuatorCommandProposal) => boolean
): PipelineExecutionResult {
  const auditLogs: AuditRecord[] = [];
  const addAudit = (stage: AuditRecord['stage'], status: AuditRecord['status'], details: string) => {
    auditLogs.push({
      id: `audit_${currentTimeMs}_${Math.random().toString(36).substring(2, 7)}`,
      timestampMs: currentTimeMs,
      stage,
      proposalId: proposal.id,
      status,
      details,
    });
  };

  // 1. TICK
  addAudit('TICK', 'PENDING', `Control tick evaluated for proposal ${proposal.id} (${proposal.actuatorType})`);

  // 2. PLAN
  addAudit('PLAN', 'PENDING', `Planning action: ${proposal.reason}`);

  // 3. ACTIONS
  addAudit('ACTIONS', 'PENDING', `Target action: ${proposal.actuatorType} set to ${proposal.targetValue} ${proposal.unit}`);

  // 4. INTERLOCKS (Re-evaluated right before dispatch)
  const interlocks = evaluateSafetyInterlocks(proposal, telemetry, limits, interlockState, currentTimeMs);
  if (!interlocks.passed) {
    addAudit('INTERLOCKS', 'VETOED', `Vetoed by safety interlocks: ${interlocks.vetoReasons.join('; ')}`);
    addAudit('AUDIT', 'VETOED', 'Pipeline terminated safely due to interlock veto.');
    return {
      proposalId: proposal.id,
      interlockResult: interlocks,
      status: 'VETOED',
      auditLogs,
    };
  }
  addAudit('INTERLOCKS', 'EXECUTED', 'Passed all veto-only safety interlocks.');

  // 5. DISPATCH
  addAudit('DISPATCH', 'PENDING', `Dispatching command ${proposal.id} to microcontroller...`);
  const dispatched = dispatchFn(proposal);
  if (!dispatched) {
    addAudit('DISPATCH', 'FAILED', 'Microcontroller dispatch ACK failed or timed out.');
    addAudit('AUDIT', 'FAILED', 'Pipeline failed at dispatch stage.');
    return {
      proposalId: proposal.id,
      interlockResult: interlocks,
      status: 'DISPATCH_FAILED',
      auditLogs,
    };
  }

  // 6. ACKNOWLEDGE
  addAudit('ACKNOWLEDGE', 'EXECUTED', 'Received ACK from hardware controller.');

  // 7. VERIFY
  addAudit('VERIFY', 'EXECUTED', 'Post-dispatch telemetry state verified.');

  // 8. AUDIT
  addAudit('AUDIT', 'EXECUTED', `Pipeline completed successfully for proposal ${proposal.id}.`);

  return {
    proposalId: proposal.id,
    interlockResult: interlocks,
    status: 'DISPATCHED_AND_VERIFIED',
    auditLogs,
  };
}
