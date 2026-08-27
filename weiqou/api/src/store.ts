import {
  ActuatorCommandProposal,
  AutonomyLevel,
  DosingOperationStep,
  FertigationState,
  PassportBlock,
  ProductMode,
  ReservoirSafetyLimits,
  TelemetryReading,
  createGenesisPassportBlock,
  appendPassportBlock,
} from '@terrasub-solarda/engine';

export interface InMemoryStore {
  mode: ProductMode;
  eStopActive: boolean;

  // TerraSub Grow Units
  growUnits: Array<{
    id: string;
    label: string;
    cropName: string;
    autonomyLevel: AutonomyLevel;
    moistureThresholdLow: number;
    targetEcMsCm: number;
    substrateBatchId: string;
    readings: TelemetryReading[];
  }>;

  // Solar-Da Reservoir Groups
  reservoirGroups: Array<{
    id: string;
    label: string;
    cropName: string;
    autonomyLevel: AutonomyLevel;
    currentEcMsCm: number;
    currentPh: number;
    currentDoMgL: number;
    currentTempC: number;
    massGrams: number;
    levelMm: number;
    towersCount: number;
    lastDoseTimestampMs: number;
    cumulative24hDoseMl: number;
    dosingStepHistory: DosingOperationStep[];
    fertigationState: FertigationState;
    readings: TelemetryReading[];
  }>;

  // Safety Limits per Crop
  limits: Record<string, ReservoirSafetyLimits>;

  // Substrate Batches
  substrateBatches: Array<{
    id: string;
    targetVolumeLiters: number;
    coirMl: number;
    vermicompostMl: number;
    biocharMl: number;
    neemMl: number;
    boneMealMl: number;
    gelatinGrams: number;
    gelatinSource: 'FISH' | 'POULTRY' | 'TANNERY' | 'OTHER';
    gelatinValid: boolean;
    trialType: string;
    mixedOn: string;
  }>;

  // Actuator Command Proposals (Human Confirmation Surface)
  proposals: ActuatorCommandProposal[];

  // Confirmed Executed Actions Audit Log
  auditLogs: Array<{
    id: string;
    timestampMs: number;
    proposalId?: string;
    action: string;
    actor: string;
    status: 'EXECUTED' | 'VETOED' | 'PENDING';
    details: string;
  }>;

  // Disease Reports
  diseaseReports: Array<{
    id: string;
    targetId: string;
    imageUrl: string;
    imageTarget: 'CANOPY' | 'ROOT_PORT';
    predictedClass: string;
    confidence: number;
    abstained: boolean;
    isTipburn: boolean;
    isPathogen: boolean;
    cureProtocol: any;
    created_at: string;
  }>;

  // Marketplace & Passports
  harvestLots: Array<{
    id: string;
    cropName: string;
    quantityKg: number;
    harvestedAt: string;
    passportChain: PassportBlock[];
  }>;

  marketplaceListings: Array<{
    id: string;
    harvestLotId: string;
    cropName: string;
    quantityKg: number;
    pricePerKg: number;
    sellerName: string;
    status: 'ACTIVE' | 'SOLD';
    createdAt: string;
  }>;
}

const genesisPassport = createGenesisPassportBlock('LOT_2026_LETTUCE_01', 'Butterhead Lettuce', Date.now() - 86400000);
const verifiedPassportChain = [
  genesisPassport,
  appendPassportBlock(genesisPassport, ['Dose 15ml MasterBlend NPK', 'Dose 5ml Calcium Nitrate'], [], true, '94% Solar Power', Date.now() - 43200000),
  appendPassportBlock(genesisPassport, ['Dose 3ml pH Down'], [], true, '98% Solar Power', Date.now() - 3600000),
];

export const store: InMemoryStore = {
  mode: 'TERRASUB_MVP',
  eStopActive: false,

  limits: {
    'Methi (Fenugreek)': {
      cropName: 'Methi (Fenugreek)',
      ecMaxMsCm: 2.2,
      ecMinMsCm: 1.2,
      phMin: 5.8,
      phMax: 6.8,
      phMaxRateOfChangePerHour: 0.5,
      doFloorMgL: 5.0,
      solutionTempCeilingC: 28,
      minLevelMm: 50,
      minCirculationDutyPct: 40,
      mixingDelayMs: 300000,
      max24hDoseMl: 300,
      sourcedFromKb: true,
    },
    'Butterhead Lettuce': {
      cropName: 'Butterhead Lettuce',
      ecMaxMsCm: 2.5,
      ecMinMsCm: 1.4,
      phMin: 5.5,
      phMax: 6.5,
      phMaxRateOfChangePerHour: 0.4,
      doFloorMgL: 6.0,
      solutionTempCeilingC: 24,
      minLevelMm: 150,
      minCirculationDutyPct: 60,
      mixingDelayMs: 600000,
      max24hDoseMl: 500,
      sourcedFromKb: true,
    },
  },

  growUnits: [
    {
      id: 'gu_horizontal_01',
      label: 'Gutter 1 - Methi Fenugreek (TerraSub)',
      cropName: 'Methi (Fenugreek)',
      autonomyLevel: 'L2_SUPERVISED',
      moistureThresholdLow: 35.0,
      targetEcMsCm: 1.6,
      substrateBatchId: 'sub_batch_001',
      readings: [
        {
          timestampMs: Date.now() - 120000,
          moisturePct: 28.5, // Below threshold 35% -> triggers moisture pulse proposal!
          ecMsCm: 1.55,
          ph: 6.2,
          ambientTempC: 27.5,
          relativeHumidityPct: 62.0,
          qualityStatus: 'VALID',
        },
      ],
    },
    {
      id: 'gu_horizontal_02',
      label: 'Gutter 2 - Palak Spinach (TerraSub)',
      cropName: 'Palak (Spinach)',
      autonomyLevel: 'L1_ADVISORY',
      moistureThresholdLow: 40.0,
      targetEcMsCm: 1.8,
      substrateBatchId: 'sub_batch_001',
      readings: [
        {
          timestampMs: Date.now() - 120000,
          moisturePct: 45.0,
          ecMsCm: 1.78,
          ph: 6.1,
          ambientTempC: 26.8,
          relativeHumidityPct: 60.0,
          qualityStatus: 'VALID',
        },
      ],
    },
  ],

  reservoirGroups: [
    {
      id: 'res_group_alpha',
      label: 'Reservoir Loop Alpha - Butterhead Towers (Solar-Da)',
      cropName: 'Butterhead Lettuce',
      autonomyLevel: 'L2_SUPERVISED',
      currentEcMsCm: 1.75,
      currentPh: 5.85,
      currentDoMgL: 6.8,
      currentTempC: 21.5,
      massGrams: 48500,
      levelMm: 420,
      towersCount: 6,
      lastDoseTimestampMs: Date.now() - 1200000,
      cumulative24hDoseMl: 80,
      dosingStepHistory: [],
      fertigationState: 'IDLE',
      readings: [
        {
          timestampMs: Date.now() - 120000,
          ecMsCm: 1.75,
          ph: 5.85,
          doMgL: 6.8,
          solutionTempC: 21.5,
          massGrams: 48500,
          levelMm: 420,
          ambientTempC: 25.0,
          relativeHumidityPct: 55.0,
          qualityStatus: 'VALID',
        },
      ],
    },
  ],

  substrateBatches: [
    {
      id: 'sub_batch_001',
      targetVolumeLiters: 2.0,
      coirMl: 1100,
      vermicompostMl: 500,
      biocharMl: 200,
      neemMl: 100,
      boneMealMl: 50,
      gelatinGrams: 10,
      gelatinSource: 'FISH',
      gelatinValid: true,
      trialType: 'FORMULA',
      mixedOn: new Date().toISOString(),
    },
  ],

  proposals: [
    {
      id: 'prop_pulse_01',
      reservoirGroupId: 'gu_horizontal_01',
      actuatorType: 'WATER_PUMP',
      targetValue: 15,
      unit: 'SEC',
      reason: 'Automated Soil Moisture Pulse (Moisture 28.5% < Threshold 35%)',
      idempotencyKey: 'pulse_key_001',
      expiresAtMs: Date.now() + 1800000,
      requiresHumanConfirmation: true,
      proposedBy: 'AUTOMATION_RULE',
      autonomyLevel: 'L2_SUPERVISED',
    },
  ],

  auditLogs: [
    {
      id: 'audit_init_01',
      timestampMs: Date.now() - 3600000,
      action: 'SYSTEM_BOOT',
      actor: 'PLATFORM_KERNEL',
      status: 'EXECUTED',
      details: 'TerraSub & Solar-Da v3 Platform initialized with dual-mode contracts and safety interlocks.',
    },
  ],

  diseaseReports: [],

  harvestLots: [
    {
      id: 'LOT_2026_LETTUCE_01',
      cropName: 'Butterhead Lettuce',
      quantityKg: 45.0,
      harvestedAt: new Date(Date.now() - 3600000).toISOString(),
      passportChain: verifiedPassportChain,
    },
  ],

  marketplaceListings: [
    {
      id: 'listing_01',
      harvestLotId: 'LOT_2026_LETTUCE_01',
      cropName: 'Butterhead Lettuce',
      quantityKg: 45.0,
      pricePerKg: 140.0,
      sellerName: 'GreenTower Farms (Solar-Da v3)',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    },
  ],
};
