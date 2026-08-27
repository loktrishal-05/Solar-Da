import { UptakeRatioResult } from './types.js';

export function calculateNutrientUptakeRatio(
  initialMassGrams: number,
  finalMassGrams: number,
  initialEcMsCm: number,
  finalEcMsCm: number,
  massNoiseThresholdGrams = 50,
  ecNoiseThresholdMsCm = 0.05
): UptakeRatioResult {
  const deltaMass = finalMassGrams - initialMassGrams;
  const deltaEc = finalEcMsCm - initialEcMsCm;
  const transpirationEstimateMl = Math.max(0, -deltaMass);

  const massDropped = deltaMass < -massNoiseThresholdGrams;
  const ecIncreased = deltaEc > ecNoiseThresholdMsCm;
  const ecDropped = deltaEc < -ecNoiseThresholdMsCm;
  const massFlat = Math.abs(deltaMass) <= massNoiseThresholdGrams;

  if (massDropped && ecIncreased) {
    return {
      deltaMassGrams: deltaMass,
      deltaEcMsCm: deltaEc,
      transpirationEstimateMl,
      diagnosis: 'WATER_DEPLETION',
      recommendedAction: 'Top up water only. Water is evaporating/transpiring faster than crop nutrient uptake.',
      canDoseNutrient: false,
      explanation: `Mass decreased by ${Math.abs(deltaMass)}g while EC increased by ${deltaEc.toFixed(3)}mS/cm. Concentration rising due to water loss.`,
    };
  }

  if (massDropped && ecDropped) {
    return {
      deltaMassGrams: deltaMass,
      deltaEcMsCm: deltaEc,
      transpirationEstimateMl,
      diagnosis: 'NUTRIENT_UPTAKE',
      recommendedAction: 'Crop actively absorbing nutrient salts. Safe to top up water and dose balanced nutrient stock.',
      canDoseNutrient: true,
      explanation: `Mass decreased by ${Math.abs(deltaMass)}g and EC decreased by ${Math.abs(deltaEc).toFixed(3)}mS/cm. Crop uptake outstrips evaporation.`,
    };
  }

  if (massFlat && ecDropped) {
    return {
      deltaMassGrams: deltaMass,
      deltaEcMsCm: deltaEc,
      transpirationEstimateMl,
      diagnosis: 'ANOMALY_OR_LEAK',
      recommendedAction: 'FLAG ANOMALY: Do not dose! Possible water leak, fresh dilution, or EC probe drift detected.',
      canDoseNutrient: false,
      explanation: `Mass remained flat (Δ ${deltaMass}g) but EC dropped by ${Math.abs(deltaEc).toFixed(3)}mS/cm. Discrepancy indicates external dilution or probe error.`,
    };
  }

  if (massFlat && !ecIncreased && !ecDropped) {
    return {
      deltaMassGrams: deltaMass,
      deltaEcMsCm: deltaEc,
      transpirationEstimateMl,
      diagnosis: 'STABLE',
      recommendedAction: 'Reservoir status stable. No immediate water or nutrient adjustment required.',
      canDoseNutrient: false,
      explanation: `Mass and EC show negligible change over interval (ΔMass: ${deltaMass}g, ΔEC: ${deltaEc.toFixed(3)}mS/cm).`,
    };
  }

  return {
    deltaMassGrams: deltaMass,
    deltaEcMsCm: deltaEc,
    transpirationEstimateMl,
    diagnosis: 'INSUFFICIENT_DATA',
    recommendedAction: 'Monitor reservoir telemetry. Baseline readings stabilizing.',
    canDoseNutrient: false,
    explanation: `Delta values (ΔMass: ${deltaMass}g, ΔEC: ${deltaEc.toFixed(3)}) within baseline fluctuation window.`,
  };
}
