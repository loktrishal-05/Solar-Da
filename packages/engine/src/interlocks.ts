import {
  ActuatorCommandProposal,
  InterlockResult,
  ReservoirSafetyLimits,
  TelemetryReading,
} from './types.js';

export interface InterlockState {
  eStopActive: boolean;
  lastDoseTimestampMs: number;
  cumulative24hDoseMl: number;
  harvestBlockActiveUntilMs: number;
}

export function evaluateSafetyInterlocks(
  proposal: ActuatorCommandProposal,
  telemetry: TelemetryReading,
  limits: ReservoirSafetyLimits,
  state: InterlockState,
  currentTimeMs: number
): InterlockResult {
  const vetoReasons: string[] = [];

  // 1. Hardware / System E-Stop
  if (state.eStopActive) {
    vetoReasons.push('SYSTEM_ESTOP_ACTIVE: Emergency stop switch or software override is active.');
  }

  // 2. Command Expiration Check
  if (currentTimeMs >= proposal.expiresAtMs) {
    vetoReasons.push(`COMMAND_EXPIRED: Proposal expired at ${proposal.expiresAtMs}, current time ${currentTimeMs}.`);
  }

  // 3. Telemetry Plausibility / Quality Interlock
  if (telemetry.qualityStatus === 'CALIBRATION_BLOCKED' || telemetry.qualityStatus === 'IMPLAUSIBLE') {
    vetoReasons.push(`INVALID_TELEMETRY: Sensor readings marked as ${telemetry.qualityStatus}. Cannot execute physical actions.`);
  }

  // 4. Dry-Run / Low Level Protection for Pumping
  if (proposal.actuatorType.includes('PUMP') && telemetry.levelMm !== undefined && telemetry.levelMm < limits.minLevelMm) {
    vetoReasons.push(`LOW_LEVEL_DRY_RUN_PROTECTION: Level ${telemetry.levelMm}mm is below minimum safety floor ${limits.minLevelMm}mm.`);
  }

  // 5. Mandatory Mixing Delay Interlock for Dosing
  if (proposal.actuatorType.includes('DOSE') || proposal.actuatorType.includes('PH')) {
    const timeSinceLastDose = currentTimeMs - state.lastDoseTimestampMs;
    if (timeSinceLastDose < limits.mixingDelayMs) {
      const remainingMs = limits.mixingDelayMs - timeSinceLastDose;
      vetoReasons.push(`MIXING_DELAY_IN_PROGRESS: Must wait ${remainingMs}ms for solution to homogenize before next dose.`);
    }

    // 6. Max 24h Cumulative Dose Limit
    const proposedMl = proposal.unit === 'ML' ? proposal.targetValue : 0;
    if (state.cumulative24hDoseMl + proposedMl > limits.max24hDoseMl) {
      vetoReasons.push(
        `MAX_24H_DOSE_EXCEEDED: Proposed ${proposedMl}ml would exceed 24h ceiling (${state.cumulative24hDoseMl}ml + ${proposedMl}ml > ${limits.max24hDoseMl}ml).`
      );
    }

    // 7. Absolute EC Ceiling Veto
    if (telemetry.ecMsCm > limits.ecMaxMsCm) {
      vetoReasons.push(`EC_CEILING_EXCEEDED: Solution EC ${telemetry.ecMsCm} mS/cm exceeds max ceiling ${limits.ecMaxMsCm} mS/cm.`);
    }

    // 8. Absolute pH Floor & Ceiling Veto
    if (telemetry.ph < limits.phMin || telemetry.ph > limits.phMax) {
      vetoReasons.push(`PH_OUT_OF_BOUNDS: Current pH ${telemetry.ph} is outside safe window [${limits.phMin}, ${limits.phMax}].`);
    }

    // 9. Solution Temp Ceiling Veto
    if (telemetry.solutionTempC !== undefined && telemetry.solutionTempC > limits.solutionTempCeilingC) {
      vetoReasons.push(
        `SOLUTION_TEMP_CEILING_EXCEEDED: Solution temp ${telemetry.solutionTempC}°C exceeds safety ceiling ${limits.solutionTempCeilingC}°C.`
      );
    }
  }

  // 10. Human Confirmation Surface Interlock (Invariant Rule 1 & 4)
  // No assistant or automated rule can execute physical action directly if user confirmation is required or autonomy < L3/L4
  if (proposal.proposedBy === 'ASSISTANT_TOOL' && proposal.requiresHumanConfirmation) {
    vetoReasons.push('HUMAN_CONFIRMATION_REQUIRED: Assistant tool outputs are proposals only and require direct human confirmation via UI.');
  }

  if (proposal.actuatorType.includes('DOSE') && proposal.autonomyLevel === 'L2_SUPERVISED' && proposal.requiresHumanConfirmation) {
    vetoReasons.push('AUTONOMY_LEVEL_RESTRICTION: Autonomy level L2 Supervised gates all chemistry dosing for human confirmation.');
  }

  // 11. Dissolved Oxygen (DO) Priority Interlock
  if (telemetry.doMgL !== undefined && telemetry.doMgL < limits.doFloorMgL && proposal.actuatorType !== 'AERATOR' && proposal.actuatorType !== 'CIRCULATION_PUMP') {
    vetoReasons.push(`DO_FLOOR_CRITICAL: DO ${telemetry.doMgL} mg/L is below floor ${limits.doFloorMgL} mg/L. Aeration takes absolute priority.`);
  }

  return {
    passed: vetoReasons.length === 0,
    vetoReasons,
    evaluatedAtMs: currentTimeMs,
    reEvalAtDispatchPassed: vetoReasons.length === 0,
  };
}
