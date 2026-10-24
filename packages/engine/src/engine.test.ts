import assert from 'node:assert';
import { test } from 'node:test';
import {
  evaluateSafetyInterlocks,
  runFixedActuatorPipeline,
  validateDosingStepSequence,
  calculateNutrientUptakeRatio,
  calculateSubstrateRecipe,
  validateGelatinSource,
  evaluateCropDoctorDiagnostic,
  recommendTerraSubCrops,
  rankSolardaCeaCropsForReservoirGroup,
  calculatePowerSchedule,
  createGenesisPassportBlock,
  appendPassportBlock,
  verifyPassportChainIntegrity,
  sha256,
  ActuatorCommandProposal,
  ReservoirSafetyLimits,
  TelemetryReading,
  InterlockState,
} from './index.js';

test('ENGINE INVARIANT 1 & 3: Safety Interlocks Veto Unsafe Commands & Human Confirmation Required', () => {
  const dummyProposal: ActuatorCommandProposal = {
    id: 'prop_001',
    reservoirGroupId: 'res_01',
    actuatorType: 'NUTRIENT_DOSE_PUMP',
    targetValue: 50,
    unit: 'ML',
    reason: 'Auto EC boost proposal',
    idempotencyKey: 'key_123',
    expiresAtMs: 200000,
    requiresHumanConfirmation: true,
    proposedBy: 'ASSISTANT_TOOL',
    autonomyLevel: 'L2_SUPERVISED',
  };

  const dummyTelemetry: TelemetryReading = {
    timestampMs: 100000,
    ecMsCm: 2.8, // Above safe limit 2.5
    ph: 5.8,
    doMgL: 6.5,
    levelMm: 300,
    qualityStatus: 'VALID',
  };

  const dummyLimits: ReservoirSafetyLimits = {
    cropName: 'Butterhead Lettuce',
    ecMaxMsCm: 2.5,
    ecMinMsCm: 1.2,
    phMin: 5.5,
    phMax: 6.5,
    phMaxRateOfChangePerHour: 0.5,
    doFloorMgL: 5.0,
    solutionTempCeilingC: 25,
    minLevelMm: 100,
    minCirculationDutyPct: 50,
    mixingDelayMs: 600000,
    max24hDoseMl: 500,
    sourcedFromKb: true,
  };

  const dummyState: InterlockState = {
    eStopActive: false,
    lastDoseTimestampMs: 0,
    cumulative24hDoseMl: 100,
    harvestBlockActiveUntilMs: 0,
  };

  const result = evaluateSafetyInterlocks(dummyProposal, dummyTelemetry, dummyLimits, dummyState, 100000);
  assert.strictEqual(result.passed, false);
  assert.ok(result.vetoReasons.some((r) => r.includes('EC_CEILING_EXCEEDED')));
  assert.ok(result.vetoReasons.some((r) => r.includes('HUMAN_CONFIRMATION_REQUIRED')));
});

test('ENGINE INVARIANT 7: Fixed Dosing Sequence Enforcement', () => {
  const step1 = validateDosingStepSequence([], 'WATER_TOPUP');
  assert.strictEqual(step1.isValidSequence, true);

  const invalidStep = validateDosingStepSequence(['WATER_TOPUP'], 'DOSE_NUTRIENT'); // Missing MIX_1 and READ_1
  assert.strictEqual(invalidStep.isValidSequence, false);
  assert.ok(invalidStep.errorReason?.includes('SAFETY INVARIANT VIOLATION'));
});

test('ENGINE INVARIANT: Substrate Gelatin Sourcing Rule (No Tannery Gelatin)', () => {
  const tanneryValidation = validateGelatinSource('TANNERY');
  assert.strictEqual(tanneryValidation.isValid, false);
  assert.ok(tanneryValidation.safetyWarning?.includes('Tannery-derived gelatin is STRICTLY PROHIBITED'));

  const fishValidation = validateGelatinSource('FISH');
  assert.strictEqual(fishValidation.isValid, true);

  const recipe = calculateSubstrateRecipe({
    targetVolumeLiters: 4.0,
    gelatinSource: 'FISH',
    trialType: 'FORMULA',
  });
  assert.strictEqual(recipe.ingredients.cocoCoirMl, 2200);
  assert.strictEqual(recipe.ingredients.gelatinGrams, 20);
});

test('ENGINE SIGNATURE DIAGNOSTIC: Nutrient Uptake Ratio (Δ Mass vs Δ EC)', () => {
  // Mass ↓, EC ↑ -> WATER_DEPLETION (Add water, do NOT dose nutrient)
  const waterDepletion = calculateNutrientUptakeRatio(10000, 9000, 1.8, 2.1);
  assert.strictEqual(waterDepletion.diagnosis, 'WATER_DEPLETION');
  assert.strictEqual(waterDepletion.canDoseNutrient, false);

  // Mass ↓, EC ↓ -> NUTRIENT_UPTAKE (Safe to dose nutrient)
  const nutrientUptake = calculateNutrientUptakeRatio(10000, 9000, 1.8, 1.5);
  assert.strictEqual(nutrientUptake.diagnosis, 'NUTRIENT_UPTAKE');
  assert.strictEqual(nutrientUptake.canDoseNutrient, true);

  // Mass flat, EC ↓ -> ANOMALY_OR_LEAK (Flag anomaly!)
  const leakAnomaly = calculateNutrientUptakeRatio(10000, 9990, 1.8, 1.5);
  assert.strictEqual(leakAnomaly.diagnosis, 'ANOMALY_OR_LEAK');
  assert.strictEqual(leakAnomaly.canDoseNutrient, false);
});

test('ENGINE CROP DOCTOR: Tipburn Discriminator & Quality Abstain Path', () => {
  // Low quality photo -> abstain
  const lowQuality = evaluateCropDoctorDiagnostic({
    imageUrl: 'http://test.com/blur.jpg',
    imageTarget: 'CANOPY',
    qualityScore: 0.3,
  });
  assert.strictEqual(lowQuality.abstained, true);
  assert.ok(lowQuality.abstainReason?.includes('QUALITY_GATE_REJECT'));

  // Extreme VPD -> Tipburn diagnosed, NOT pathogen
  const tipburn = evaluateCropDoctorDiagnostic({
    imageUrl: 'http://test.com/leaf.jpg',
    imageTarget: 'CANOPY',
    qualityScore: 0.9,
    currentVpdKpa: 0.3, // Extreme low VPD
  });
  assert.strictEqual(tipburn.isTipburn, true);
  assert.strictEqual(tipburn.isPathogen, false);
  assert.ok(tipburn.cureProtocol?.description.includes('Do NOT apply fungicide'));
});

test('ENGINE POWER SCHEDULER: Minimum Circulation Duty Floor Is Maintained Under Critical Shed', () => {
  const criticalPower = calculatePowerSchedule({
    solarPowerWatts: 0,
    batterySocPct: 10,
    batteryReserveFloorPct: 20,
    isGridAvailable: false,
  });
  assert.strictEqual(criticalPower.currentMode, 'CRITICAL_LOAD_SHED');
  assert.strictEqual(criticalPower.allowSupplementalLighting, false);
  assert.strictEqual(criticalPower.allowDosingPumps, false);
  assert.strictEqual(criticalPower.allowCirculationPump, true); // MUST BE TRUE
});

test('ENGINE TRACEABILITY PASSPORT: Cryptographic Block Chain Verification', () => {
  const genesis = createGenesisPassportBlock('LOT_2026_01', 'Butterhead Lettuce', 1000);
  const block1 = appendPassportBlock(genesis, ['Dose 10ml A', 'Dose 10ml B'], [], true, '90% Solar', 2000);
  const block2 = appendPassportBlock(block1, ['Dose 5ml pH Down'], [], true, '95% Solar', 3000);

  const verification = verifyPassportChainIntegrity([genesis, block1, block2]);
  assert.strictEqual(verification.isChainValid, true);

  // Tamper test
  const tamperedBlock1 = { ...block1, blockHash: '0xBAD_HASH' };
  const tamperedVerification = verifyPassportChainIntegrity([genesis, tamperedBlock1, block2]);
  assert.strictEqual(tamperedVerification.isChainValid, false);
});

test('ENGINE PASSPORT: sha256 matches known vectors', () => {
  assert.strictEqual(sha256(''), '0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.strictEqual(sha256('abc'), '0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.strictEqual(
    sha256('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    '0x248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1'
  );
});
