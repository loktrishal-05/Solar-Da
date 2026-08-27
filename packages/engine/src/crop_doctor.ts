import { CropDoctorDiagnosticInput, CropDoctorDiagnosticOutput } from './types.js';

export function evaluateCropDoctorDiagnostic(
  input: CropDoctorDiagnosticInput,
  minConfidenceThreshold = 0.70
): CropDoctorDiagnosticOutput {
  // Quality Gate: Photo quality check
  if (input.qualityScore < 0.50) {
    return {
      modelVersion: 'CropDoctor_v3.2_MobileNetV2',
      confidenceScore: input.qualityScore,
      abstained: true,
      abstainReason: 'QUALITY_GATE_REJECT: Image is blurry, improperly lit, or misframed. Please retake photo with clear focus on root/leaf.',
      primaryDiagnosis: 'UNREADABLE_IMAGE',
      isTipburn: false,
      isPathogen: false,
      explainTrace: {
        vpdCheck: 'N/A',
        ecCheck: 'N/A',
        rootCondition: 'N/A',
      },
    };
  }

  // Check Tipburn vs. Pathogen Discriminator
  // Tipburn is driven by low VPD (<0.4 kPa or >1.6 kPa) and inadequate calcium transport during rapid growth
  const vpd = input.currentVpdKpa ?? 1.0;
  const ec = input.currentEcMsCm ?? 1.8;
  const isVpdExtreme = vpd < 0.4 || vpd > 1.6;

  // Root port analysis logic
  const isRootPort = input.imageTarget === 'ROOT_PORT';
  const solutionAge = input.solutionAgeHours ?? 48;
  
  // Heuristic mock scoring for deterministic engine evaluation
  let primaryDiagnosis = 'HEALTHY_CANOPY_AND_ROOTS';
  let isTipburn = false;
  let isPathogen = false;
  let confidence = 0.88;

  if (isVpdExtreme && !isRootPort) {
    isTipburn = true;
    primaryDiagnosis = 'LEAF_TIPBURN_CALCIUM_DEFICIENCY';
    confidence = 0.92;
  } else if (isRootPort && solutionAge > 120) {
    isPathogen = true;
    primaryDiagnosis = 'PYTHIUM_ROOT_ROT';
    confidence = 0.85;
  } else if (!isRootPort && ec < 1.0) {
    primaryDiagnosis = 'GENERAL_NUTRIENT_DEFICIENCY_LOW_EC';
    confidence = 0.81;
  }

  // Abstain path if confidence is below threshold
  if (confidence < minConfidenceThreshold) {
    return {
      modelVersion: 'CropDoctor_v3.2_MobileNetV2',
      confidenceScore: confidence,
      abstained: true,
      abstainReason: `LOW_CONFIDENCE: Model confidence (${(confidence * 100).toFixed(1)}%) is below mandatory threshold (${(minConfidenceThreshold * 100).toFixed(1)}%). Escalating to Agronomist review.`,
      primaryDiagnosis: 'AMBIGUOUS_SYMPTOMS',
      isTipburn: false,
      isPathogen: false,
      explainTrace: {
        vpdCheck: `Current VPD: ${vpd} kPa`,
        ecCheck: `Current EC: ${ec} mS/cm`,
        rootCondition: `Solution age: ${solutionAge}h`,
      },
    };
  }

  const affectedTowers = input.connectedTowersCount ?? 4;
  const harvestBlockDays = isPathogen ? 14 : isTipburn ? 0 : 3;

  return {
    modelVersion: 'CropDoctor_v3.2_MobileNetV2',
    confidenceScore: confidence,
    abstained: false,
    primaryDiagnosis,
    isTipburn,
    isPathogen,
    isolationBlastRadius: isPathogen
      ? {
          reservoirGroupId: 'res_group_shared_loop_01',
          affectedTowersCount: affectedTowers,
          recommendedIsolationSteps: [
            `ISOLATION MANDATE: Drain and flush shared loop feeding ${affectedTowers} connected towers.`,
            'Apply hydrogen peroxide / food-grade sanitizer flush before next batch cycle.',
            'Inspect root net-ports of adjacent towers for browning/slime.',
          ],
        }
      : undefined,
    cureProtocol: {
      protocolId: isTipburn ? 'PROTO_TIPBURN_VPD_CORRECTION' : isPathogen ? 'PROTO_PYTHIUM_ROOT_FLUSH' : 'PROTO_EC_TOPUP',
      description: isTipburn
        ? 'Adjust air circulation fans to restore VPD to target window (0.8 - 1.2 kPa). Do NOT apply fungicide!'
        : isPathogen
        ? 'Isolate affected tower, perform root zone peroxide flush (0.1% H2O2), replace nutrient solution.'
        : 'Adjust EC setpoint up by +0.3 mS/cm.',
      correctiveRecipe: isTipburn
        ? 'Increase night-time air velocity; ensure foliage transpiration flow.'
        : 'Flush with 20 PPM food-grade H2O2 solution for 30 minutes; re-inoculate with beneficial Trichoderma after 24h.',
      harvestBlockDays,
      followUpScheduleHours: 24,
    },
    explainTrace: {
      vpdCheck: `VPD is ${vpd} kPa (${isVpdExtreme ? 'OUT OF BOUNDS - drives tipburn' : 'Within optimal range 0.8-1.2 kPa'})`,
      ecCheck: `EC is ${ec} mS/cm`,
      rootCondition: isRootPort ? `Root net-port inspection evaluated (Solution age ${solutionAge}h)` : 'Canopy view evaluated',
    },
  };
}
