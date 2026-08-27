/**
 * Shared domain types for TerraSub & Solar-Da v3 Platform
 * Pure types with no external runtime I/O dependencies.
 */

export type ProductMode = 'TERRASUB_MVP' | 'SOLARDA_V3';

export type AutonomyLevel = 'L0_MANUAL' | 'L1_ADVISORY' | 'L2_SUPERVISED' | 'L3_AUTO_CHEMISTRY' | 'L4_FULL_AUTO';

export type FertigationState =
  | 'IDLE'
  | 'PENDING_CONFIRMATION'
  | 'DOSING'
  | 'RELEASED'
  | 'DOSE_COMPLETE'
  | 'INTERLOCK_VETOED';

export type DosingOperationStep =
  | 'WATER_TOPUP'
  | 'MIX_1'
  | 'READ_1'
  | 'DOSE_NUTRIENT'
  | 'MIX_2'
  | 'READ_2'
  | 'CORRECT_PH'
  | 'MIX_3'
  | 'READ_3_FINAL';

export const REQUIRED_DOSING_SEQUENCE: DosingOperationStep[] = [
  'WATER_TOPUP',
  'MIX_1',
  'READ_1',
  'DOSE_NUTRIENT',
  'MIX_2',
  'READ_2',
  'CORRECT_PH',
  'MIX_3',
  'READ_3_FINAL',
];

export interface TelemetryReading {
  timestampMs: number;
  ecMsCm: number;
  ph: number;
  doMgL?: number;
  solutionTempC?: number;
  massGrams?: number;
  levelMm?: number;
  flowRateLmin?: number;
  ambientTempC?: number;
  relativeHumidityPct?: number;
  moisturePct?: number; // TerraSub soil moisture
  qualityStatus: 'VALID' | 'SUSPECT' | 'STALE' | 'MISSING' | 'IMPLAUSIBLE' | 'CALIBRATION_BLOCKED';
}

export interface ReservoirSafetyLimits {
  cropName: string;
  ecMaxMsCm: number;
  ecMinMsCm: number;
  phMin: number;
  phMax: number;
  phMaxRateOfChangePerHour: number;
  doFloorMgL: number;
  solutionTempCeilingC: number;
  minLevelMm: number;
  minCirculationDutyPct: number;
  mixingDelayMs: number;
  max24hDoseMl: number;
  sourcedFromKb: boolean;
  unverifiedWarning?: string;
}

export interface ActuatorCommandProposal {
  id: string;
  reservoirGroupId: string;
  actuatorType: 'WATER_PUMP' | 'NUTRIENT_DOSE_PUMP' | 'PH_UP_PUMP' | 'PH_DOWN_PUMP' | 'AERATOR' | 'CIRCULATION_PUMP' | 'LIGHTING' | 'FAN_VENT';
  targetValue: number; // e.g. durationSec or volumeMl or state 0/1
  unit: 'SEC' | 'ML' | 'PCT' | 'BOOLEAN';
  step?: DosingOperationStep;
  reason: string;
  idempotencyKey: string;
  expiresAtMs: number;
  requiresHumanConfirmation: boolean;
  proposedBy: 'AUTOMATION_RULE' | 'ASSISTANT_TOOL' | 'REPLENISHMENT_ENGINE' | 'MANUAL_OPERATOR';
  autonomyLevel: AutonomyLevel;
}

export interface InterlockResult {
  passed: boolean;
  vetoReasons: string[];
  evaluatedAtMs: number;
  reEvalAtDispatchPassed?: boolean;
}

export interface GelatinSourceValidation {
  source: 'FISH' | 'POULTRY' | 'TANNERY' | 'OTHER';
  isValid: boolean;
  safetyWarning?: string;
}

export interface SubstrateRecipeRequest {
  targetVolumeLiters: number;
  gelatinSource: 'FISH' | 'POULTRY' | 'TANNERY' | 'OTHER';
  trialType?: 'CONTROL' | 'BENCHMARK' | 'FORMULA' | 'ISOLATION_NO_GELATIN';
}

export interface SubstrateRecipeResult {
  targetVolumeLiters: number;
  ingredients: {
    cocoCoirMl: number;
    vermicompostMl: number;
    riceHuskBiocharMl: number;
    neemCakePowderMl: number;
    boneMealMl: number;
    gelatinGrams: number;
    coldWaterMl: number;
    warmWaterMl: number;
  };
  gelatinValidation: GelatinSourceValidation;
  prepSequence: string[];
  cautions: string[];
  trialType: string;
}

export type UptakeDiagnosisType =
  | 'WATER_DEPLETION' // Mass ↓, EC ↑ -> transpiration outstripping nutrients -> top up water
  | 'NUTRIENT_UPTAKE' // Mass ↓, EC ↓ -> crop taking up nutrients -> dose nutrient stock
  | 'ANOMALY_OR_LEAK' // Mass ~flat, EC ↓ -> leak/dilution/probe drift -> FLAG, DO NOT DOSE
  | 'STABLE'           // Mass flat, EC flat
  | 'INSUFFICIENT_DATA';

export interface UptakeRatioResult {
  deltaMassGrams: number;
  deltaEcMsCm: number;
  transpirationEstimateMl: number;
  diagnosis: UptakeDiagnosisType;
  recommendedAction: string;
  canDoseNutrient: boolean;
  explanation: string;
}

export interface CropDoctorDiagnosticInput {
  imageUrl: string;
  imageTarget: 'CANOPY' | 'ROOT_PORT';
  qualityScore: number; // 0..1
  currentVpdKpa?: number;
  currentEcMsCm?: number;
  currentPh?: number;
  solutionAgeHours?: number;
  connectedTowersCount?: number;
}

export interface CropDoctorDiagnosticOutput {
  modelVersion: string;
  confidenceScore: number;
  abstained: boolean;
  abstainReason?: string;
  primaryDiagnosis: string;
  isTipburn: boolean;
  isPathogen: boolean;
  isolationBlastRadius?: {
    reservoirGroupId: string;
    affectedTowersCount: number;
    recommendedIsolationSteps: string[];
  };
  cureProtocol?: {
    protocolId: string;
    description: string;
    correctiveRecipe: string;
    harvestBlockDays: number;
    followUpScheduleHours: number;
  };
  explainTrace: {
    vpdCheck: string;
    ecCheck: string;
    rootCondition: string;
  };
}

export interface PassportBlock {
  index: number;
  previousHash: string;
  timestampMs: number;
  harvestLotId: string;
  cropName: string;
  dosagesSummary: string[];
  treatmentApplications: string[];
  harvestBlockComplianceVerified: boolean;
  energyMixSummary: string;
  blockHash: string;
}
