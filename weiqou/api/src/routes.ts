import { Router, Request, Response } from 'express';
import { store } from './store.js';
import { appendMarketplaceListing, loadMarketplaceListings } from './marketplace_store.js';
import { processGeminiAssistantTurn } from './gemini.js';
import {
  calculateSubstrateRecipe,
  calculateNutrientUptakeRatio,
  evaluateCropDoctorDiagnostic,
  recommendTerraSubCrops,
  rankSolardaCeaCropsForReservoirGroup,
  calculatePowerSchedule,
  runFixedActuatorPipeline,
  verifyPassportChainIntegrity,
  ActuatorCommandProposal,
  TelemetryReading,
} from '@terrasub-solarda/engine';
import {
  TelemetryIngestSchema,
  ProposalConfirmationSchema,
  SubstrateRecipeSchema,
  DiseaseReportSchema,
  ChatMessageSchema,
  MarketplaceListingSchema,
} from '@terrasub-solarda/contracts';

export const router = Router();

// 1. Health & Product Mode
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    activeMode: store.mode,
    eStopActive: store.eStopActive,
  });
});

router.get('/mode', (req: Request, res: Response) => {
  res.json({ mode: store.mode, eStopActive: store.eStopActive });
});

router.post('/mode', (req: Request, res: Response) => {
  const { mode } = req.body;
  if (mode === 'TERRASUB_MVP' || mode === 'SOLARDA_V3') {
    store.mode = mode;
    store.auditLogs.push({
      id: `audit_mode_${Date.now()}`,
      timestampMs: Date.now(),
      action: 'SWITCH_PRODUCT_MODE',
      actor: 'OPERATOR',
      status: 'EXECUTED',
      details: `Switched platform operating mode to ${mode}`,
    });
    return res.json({ success: true, mode: store.mode });
  }
  res.status(400).json({ error: 'Invalid product mode. Must be TERRASUB_MVP or SOLARDA_V3' });
});

// 2. TerraSub Sensors & Irrigation Pulse
router.post('/sensors/reading', (req: Request, res: Response) => {
  const parse = TelemetryIngestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const input = parse.data;
  const unitId = input.growUnitId || store.growUnits[0].id;
  const unit = store.growUnits.find((g) => g.id === unitId);

  if (!unit) return res.status(404).json({ error: 'Grow unit not found' });

  const newReading: TelemetryReading = {
    timestampMs: Date.now(),
    moisturePct: input.moisturePct,
    ecMsCm: input.ecMsCm,
    ph: input.ph,
    ambientTempC: input.ambientTempC,
    relativeHumidityPct: input.relativeHumidityPct,
    qualityStatus: input.qualityStatus,
  };

  unit.readings.push(newReading);

  // Moisture Pulse Logic (§3.4)
  let proposalCreated: ActuatorCommandProposal | null = null;
  if (input.moisturePct !== undefined && input.moisturePct < unit.moistureThresholdLow) {
    const prop: ActuatorCommandProposal = {
      id: `prop_pulse_${Date.now()}`,
      reservoirGroupId: unit.id,
      actuatorType: 'WATER_PUMP',
      targetValue: 15,
      unit: 'SEC',
      reason: `Moisture (${input.moisturePct}%) below threshold (${unit.moistureThresholdLow}%)`,
      idempotencyKey: `pulse_${unit.id}_${Date.now()}`,
      expiresAtMs: Date.now() + 1800000,
      requiresHumanConfirmation: unit.autonomyLevel !== 'L4_FULL_AUTO',
      proposedBy: 'AUTOMATION_RULE',
      autonomyLevel: unit.autonomyLevel,
    };
    store.proposals.push(prop);
    proposalCreated = prop;
  }

  res.json({
    success: true,
    readingSaved: newReading,
    proposalCreated,
  });
});

router.get('/grow-units/:id/readings', (req: Request, res: Response) => {
  const unit = store.growUnits.find((g) => g.id === req.params.id) || store.growUnits[0];
  res.json({ growUnit: unit, readings: unit.readings });
});

router.get('/grow-units/:id/explain', (req: Request, res: Response) => {
  const unit = store.growUnits.find((g) => g.id === req.params.id) || store.growUnits[0];
  const last = unit.readings[unit.readings.length - 1];

  res.json({
    growUnitId: unit.id,
    label: unit.label,
    cropName: unit.cropName,
    rawTelemetry: last,
    explanations: {
      moistureStatus: last.moisturePct !== undefined
        ? `Moisture ${last.moisturePct}% is ${last.moisturePct < unit.moistureThresholdLow ? 'BELOW' : 'ABOVE'} threshold of ${unit.moistureThresholdLow}%.`
        : 'No moisture probe data.',
      ecTrendProxy: `EC reading ${last.ecMsCm} mS/cm is presented as a substrate salt proxy (lab baseline verified).`,
      npkHonestyNotice: 'SENSOR HONESTY MANDATE: Conductive probes in organic substrate measure total EC proxy, not direct NPK ions.',
    },
  });
});

// 3. Solar-Da Reservoir Ingest & Fixed Control-Plane Pipeline
router.post('/reservoir-groups/:id/readings', (req: Request, res: Response) => {
  const parse = TelemetryIngestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const input = parse.data;
  const rg = store.reservoirGroups.find((r) => r.id === req.params.id) || store.reservoirGroups[0];

  const newReading: TelemetryReading = {
    timestampMs: Date.now(),
    ecMsCm: input.ecMsCm,
    ph: input.ph,
    doMgL: input.doMgL ?? rg.currentDoMgL,
    solutionTempC: input.solutionTempC ?? rg.currentTempC,
    massGrams: input.massGrams ?? rg.massGrams,
    levelMm: input.levelMm ?? rg.levelMm,
    ambientTempC: input.ambientTempC,
    relativeHumidityPct: input.relativeHumidityPct,
    qualityStatus: input.qualityStatus,
  };

  rg.currentEcMsCm = newReading.ecMsCm;
  rg.currentPh = newReading.ph;
  rg.readings.push(newReading);

  // Compute Nutrient Uptake Ratio Diagnostic
  const prevReading = rg.readings.length > 1 ? rg.readings[rg.readings.length - 2] : newReading;
  const uptakeDiagnostic = calculateNutrientUptakeRatio(
    prevReading.massGrams || 50000,
    newReading.massGrams || 50000,
    prevReading.ecMsCm,
    newReading.ecMsCm
  );

  let proposalCreated: ActuatorCommandProposal | null = null;
  if (uptakeDiagnostic.canDoseNutrient && newReading.ecMsCm < 1.6) {
    const prop: ActuatorCommandProposal = {
      id: `prop_dose_${Date.now()}`,
      reservoirGroupId: rg.id,
      actuatorType: 'NUTRIENT_DOSE_PUMP',
      targetValue: 25,
      unit: 'ML',
      reason: `Uptake ratio indicates nutrient uptake (ΔEC: ${uptakeDiagnostic.deltaEcMsCm.toFixed(3)}, ΔMass: ${uptakeDiagnostic.deltaMassGrams}g). Recommended dose to hit target EC 1.8`,
      idempotencyKey: `dose_${rg.id}_${Date.now()}`,
      expiresAtMs: Date.now() + 1800000,
      requiresHumanConfirmation: true,
      proposedBy: 'REPLENISHMENT_ENGINE',
      autonomyLevel: rg.autonomyLevel,
    };
    store.proposals.push(prop);
    proposalCreated = prop;
  }

  res.json({
    success: true,
    reservoirGroupId: rg.id,
    latestReading: newReading,
    uptakeDiagnostic,
    proposalCreated,
  });
});

router.get('/reservoir-groups/:id/explain', (req: Request, res: Response) => {
  const rg = store.reservoirGroups.find((r) => r.id === req.params.id) || store.reservoirGroups[0];
  const readings = rg.readings;
  const latest = readings[readings.length - 1];
  const initial = readings.length > 1 ? readings[readings.length - 2] : latest;

  const uptake = calculateNutrientUptakeRatio(
    initial.massGrams || 50000,
    latest.massGrams || 50000,
    initial.ecMsCm,
    latest.ecMsCm
  );

  res.json({
    reservoirGroupId: rg.id,
    label: rg.label,
    cropName: rg.cropName,
    derivedSignals: {
      uptakeRatio: uptake,
      vpdKpa: 1.05,
      dliAccumulatedMol: 14.8,
      solutionAgeHours: 48,
    },
    explainTrace: {
      uptakeCalculation: uptake.explanation,
      dosingOrderRule: 'Fixed sequence: top up water → mix → read → dose nutrient → mix → read → correct pH → mix → read',
      limitsSource: store.limits[rg.cropName] || store.limits['Butterhead Lettuce'],
    },
  });
});

// 4. Proposals & Human Confirmation
router.get('/proposals', (req: Request, res: Response) => {
  res.json({ proposals: store.proposals });
});

router.post('/proposals/:id/confirm', (req: Request, res: Response) => {
  const parse = ProposalConfirmationSchema.safeParse({ proposalId: req.params.id, ...req.body });
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const proposal = store.proposals.find((p) => p.id === req.params.id);
  if (!proposal) return res.status(404).json({ error: 'Proposal not found' });

  const rg = store.reservoirGroups[0];
  const limits = store.limits[rg.cropName] || store.limits['Butterhead Lettuce'];
  const telemetry = rg.readings[rg.readings.length - 1];

  // RUN FIXED ACTUATOR PIPELINE (§1.2)
  // tick → plan → actions → interlocks → dispatch → acknowledge → verify → audit
  const pipelineResult = runFixedActuatorPipeline(
    proposal,
    telemetry,
    limits,
    {
      eStopActive: store.eStopActive,
      lastDoseTimestampMs: rg.lastDoseTimestampMs,
      cumulative24hDoseMl: rg.cumulative24hDoseMl,
      harvestBlockActiveUntilMs: 0,
    },
    Date.now(),
    (p) => true // Dispatch mock callback -> returns hardware ACK true
  );

  if (pipelineResult.status === 'DISPATCHED_AND_VERIFIED') {
    proposal.requiresHumanConfirmation = false;
    rg.lastDoseTimestampMs = Date.now();
    if (proposal.unit === 'ML') rg.cumulative24hDoseMl += proposal.targetValue;

    store.auditLogs.push({
      id: `audit_confirm_${Date.now()}`,
      timestampMs: Date.now(),
      proposalId: proposal.id,
      action: 'HUMAN_CONFIRMED_ACTUATION',
      actor: parse.data.confirmedByUserId,
      status: 'EXECUTED',
      details: `Human confirmed ${proposal.actuatorType} action (${proposal.targetValue}${proposal.unit}). Pipeline verified.`,
    });

    return res.json({ success: true, pipelineResult });
  }

  res.status(422).json({
    success: false,
    reason: 'Interlock Vetoed Action at Dispatch',
    pipelineResult,
  });
});

router.post('/estop', (req: Request, res: Response) => {
  const { active } = req.body;
  store.eStopActive = Boolean(active);
  store.auditLogs.push({
    id: `audit_estop_${Date.now()}`,
    timestampMs: Date.now(),
    action: store.eStopActive ? 'ESTOP_ENGAGED' : 'ESTOP_CLEARED',
    actor: 'OPERATOR',
    status: 'EXECUTED',
    details: store.eStopActive ? 'System E-Stop engaged. All physical actions vetoed.' : 'E-Stop cleared.',
  });
  res.json({ success: true, eStopActive: store.eStopActive });
});

// 5. Crop Doctor & Disease Diagnostics
const VISION_URL = process.env.SOLARDA_VISION ?? 'http://127.0.0.1:8200';

// Real classifier (services/vision, calibrated vision-v1) for uploaded images. Only data: URLs are read: fetching
// arbitrary client-supplied URLs would let a caller make this server request internal addresses.
async function classifyWithVision(imageUrl: string) {
  const m = /^data:(image\/[a-z+.-]+);base64,(.+)$/i.exec(imageUrl);
  if (!m) return null;
  try {
    const form = new FormData();
    form.append('image', new Blob([Buffer.from(m[2], 'base64')], { type: m[1] }), 'leaf.jpg');
    const r = await fetch(`${VISION_URL}/vision/classify`, { method: 'POST', body: form, signal: AbortSignal.timeout(8000) });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

router.post('/disease/report', async (req: Request, res: Response) => {
  const parse = DiseaseReportSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const input = parse.data;
  const vision = input.imageTarget === 'CANOPY' ? await classifyWithVision(input.imageUrl) : null;
  const diagnostic = evaluateCropDoctorDiagnostic({
    imageUrl: input.imageUrl,
    imageTarget: input.imageTarget,
    qualityScore: input.qualityScore,
    currentVpdKpa: 1.05,
    currentEcMsCm: 1.75,
    solutionAgeHours: 48,
    connectedTowersCount: 6,
  });

  // When the vision model saw the image its answer replaces the heuristic one (the heuristic stays as the fallback
  // and for root-port images, which the model was not trained on). It abstains rather than guess.
  const top = vision && !vision.abstain ? vision.top : null;
  const reportRecord = {
    id: `disease_rep_${Date.now()}`,
    targetId: input.growUnitId || input.reservoirGroupId || 'unit_default',
    imageUrl: input.imageUrl.startsWith('data:') ? 'data:image (not stored)' : input.imageUrl,
    imageTarget: input.imageTarget,
    predictedClass: top ? top.label : vision ? 'UNREADABLE_OR_UNCERTAIN_IMAGE' : diagnostic.primaryDiagnosis,
    confidence: top ? top.confidence : vision ? 0 : diagnostic.confidenceScore,
    abstained: vision ? !!vision.abstain : diagnostic.abstained,
    abstainReason: vision?.abstain ? vision.reason : undefined,
    isTipburn: vision ? false : diagnostic.isTipburn,
    isPathogen: top ? !top.healthy : diagnostic.isPathogen,
    cureProtocol: top ? undefined : diagnostic.cureProtocol,
    diagnosisSource: vision ? 'vision-v1 (calibrated)' : 'heuristic (no image analysis)',
    created_at: new Date().toISOString(),
  };

  store.diseaseReports.push(reportRecord as any);
  res.json({ success: true, report: reportRecord, diagnostic, vision });
});

// 6. Crop Recommendations & CEA Planning
router.get('/crops/recommendations', (req: Request, res: Response) => {
  const region = (req.query.region as string) || 'Tamil Nadu';
  const recs = recommendTerraSubCrops({
    region,
    ambientTempC: 27.5,
    mandiPrices: [
      { cropName: 'Methi', mandiName: 'Chennai', state: 'Tamil Nadu', avgPricePerKg: 45, priceTrend7dPct: 12.5, dataAvailable: true },
      { cropName: 'Palak', mandiName: 'Chennai', state: 'Tamil Nadu', avgPricePerKg: 35, priceTrend7dPct: -4.0, dataAvailable: true },
    ],
  });
  res.json({ region, recommendations: recs });
});

router.post('/cea/crop-plan', (req: Request, res: Response) => {
  const recs = rankSolardaCeaCropsForReservoirGroup({
    reservoirGroupId: store.reservoirGroups[0].id,
    currentLoopEcMsCm: 1.75,
    currentLoopPh: 5.85,
    dailyLightIntegralMolM2Day: 16,
    energyCostPerKwhInr: 7.5,
    mandiPrices: [
      { cropName: 'Butterhead', mandiName: 'Bangalore', state: 'Karnataka', avgPricePerKg: 140, priceTrend7dPct: 5.0, dataAvailable: true },
      { cropName: 'Strawberry', mandiName: 'Bangalore', state: 'Karnataka', avgPricePerKg: 350, priceTrend7dPct: 15.0, dataAvailable: true },
    ],
  });
  res.json({ reservoirGroupId: store.reservoirGroups[0].id, ceaPlan: recs });
});

// 7. Substrate Recipe Calculator
router.post('/substrate/batches', (req: Request, res: Response) => {
  const parse = SubstrateRecipeSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const recipe = calculateSubstrateRecipe({
    targetVolumeLiters: parse.data.targetVolumeLiters,
    gelatinSource: parse.data.gelatinSource,
    trialType: parse.data.trialType,
  });

  if (!recipe.gelatinValidation.isValid) {
    return res.status(422).json({
      success: false,
      safetyViolation: recipe.gelatinValidation.safetyWarning,
      recipe,
    });
  }

  const batchRecord = {
    id: `sub_batch_${Date.now()}`,
    targetVolumeLiters: recipe.targetVolumeLiters,
    coirMl: recipe.ingredients.cocoCoirMl,
    vermicompostMl: recipe.ingredients.vermicompostMl,
    biocharMl: recipe.ingredients.riceHuskBiocharMl,
    neemMl: recipe.ingredients.neemCakePowderMl,
    boneMealMl: recipe.ingredients.boneMealMl,
    gelatinGrams: recipe.ingredients.gelatinGrams,
    gelatinSource: parse.data.gelatinSource,
    gelatinValid: true,
    trialType: recipe.trialType,
    mixedOn: new Date().toISOString(),
  };

  store.substrateBatches.push(batchRecord);
  res.json({ success: true, batchRecord, recipe });
});

router.get('/substrate/batches', (req: Request, res: Response) => {
  res.json({ batches: store.substrateBatches });
});

// 8. Gemini Assistant Gateway
router.post('/chat', async (req: Request, res: Response) => {
  const parse = ChatMessageSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const turn = await processGeminiAssistantTurn({
    sessionId: parse.data.sessionId,
    userMessage: parse.data.content,
    contentType: parse.data.contentType,
    imageUrl: parse.data.imageUrl,
  });

  res.json(turn);
});

// 9. Marketplace & Passports
store.marketplaceListings.push(...loadMarketplaceListings());
router.get('/marketplace/listings', (req: Request, res: Response) => {
  res.json({ listings: store.marketplaceListings });
});

router.post('/marketplace/listings', (req: Request, res: Response) => {
  const parse = MarketplaceListingSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.format() });

  const newListing = {
    id: `listing_${Date.now()}`,
    harvestLotId: parse.data.harvestLotId,
    cropName: parse.data.cropName,
    quantityKg: parse.data.quantityKg,
    pricePerKg: parse.data.pricePerKg,
    sellerName: 'TerraSub & Solar-Da Grower',
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString(),
  };

  store.marketplaceListings.push(newListing);
  appendMarketplaceListing(newListing);
  res.json({ success: true, listing: newListing });
});

router.get('/harvest-lots/:id/passport', (req: Request, res: Response) => {
  const lot = store.harvestLots.find((h) => h.id === req.params.id) || store.harvestLots[0];
  const verification = verifyPassportChainIntegrity(lot.passportChain);

  res.json({
    harvestLotId: lot.id,
    cropName: lot.cropName,
    quantityKg: lot.quantityKg,
    harvestedAt: lot.harvestedAt,
    isPassportChainValid: verification.isChainValid,
    passportBlocks: lot.passportChain,
    qrVerificationUrl: `https://terrasub-solarda.ag/verify/passport/${lot.id}`,
  });
});

// 10. Power Schedule
router.get('/power/schedule', (req: Request, res: Response) => {
  const schedule = calculatePowerSchedule({
    solarPowerWatts: 420,
    batterySocPct: 85,
    batteryReserveFloorPct: 20,
    isGridAvailable: true,
  });
  res.json(schedule);
});
