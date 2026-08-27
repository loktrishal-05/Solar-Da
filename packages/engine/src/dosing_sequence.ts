import { DosingOperationStep, REQUIRED_DOSING_SEQUENCE } from './types.js';

export interface DosingSequenceValidation {
  isValidSequence: boolean;
  expectedStep: DosingOperationStep;
  actualStep: DosingOperationStep;
  errorReason?: string;
}

/**
 * Enforces fixed dosing operation order:
 * top up water → mix → read → dose nutrient → mix → read → correct pH → mix → read
 */
export function validateDosingStepSequence(
  currentHistory: DosingOperationStep[],
  nextProposedStep: DosingOperationStep
): DosingSequenceValidation {
  const expectedIndex = currentHistory.length % REQUIRED_DOSING_SEQUENCE.length;
  const expectedStep = REQUIRED_DOSING_SEQUENCE[expectedIndex];

  if (nextProposedStep !== expectedStep) {
    return {
      isValidSequence: false,
      expectedStep,
      actualStep: nextProposedStep,
      errorReason: `SAFETY INVARIANT VIOLATION: Dosing operation out of order. Expected step '${expectedStep}', but received '${nextProposedStep}'. Fixed order must be: ${REQUIRED_DOSING_SEQUENCE.join(' → ')}`,
    };
  }

  return {
    isValidSequence: true,
    expectedStep,
    actualStep: nextProposedStep,
  };
}
