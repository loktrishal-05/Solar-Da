export interface MandiCropPrice {
  cropName: string;
  mandiName: string;
  state: string;
  avgPricePerKg: number;
  priceTrend7dPct: number; // e.g. +12.5 means 12.5% price increase over 7 days
  dataAvailable: boolean;
}

export interface TerraSubCropRecommendationInput {
  region: string;
  ambientTempC: number;
  mandiPrices: MandiCropPrice[];
}

export interface TerraSubCropRecommendationOutput {
  cropName: string;
  score: number;
  avgMandiPricePerKg: number | null;
  priceTrend7dPct: number | null;
  climateFitScore: number;
  substrateSuitability: number;
  explainTrace: {
    priceComponent: string;
    climateComponent: string;
    substrateComponent: string;
    formula: string;
  };
}

export interface SolardaCeaCropProfile {
  cropName: string;
  ecTargetMsCm: number;
  phTarget: number;
  dliTargetMolM2Day: number;
  cycleDays: number;
  expectedYieldKgPerPort: number;
}

export interface SolardaCeaCropRecommendationInput {
  reservoirGroupId: string;
  currentLoopEcMsCm: number;
  currentLoopPh: number;
  dailyLightIntegralMolM2Day: number;
  energyCostPerKwhInr: number;
  mandiPrices: MandiCropPrice[];
}

export interface SolardaCeaCropRecommendationOutput {
  cropName: string;
  rank: number;
  loopCompatibilityScore: number;
  estimatedCycleDays: number;
  forecastRevenuePerPortInr: number;
  estimatedEnergyCostPerPortInr: number;
  netMarginPerPortInr: number;
  isLoopCompatible: boolean;
  explainTrace: string;
}

/**
 * TerraSub Transparent Heuristic Crop Recommender:
 * score = normalize(price_trend_7d) * 0.5 + climate_fit_score * 0.3 + substrate_suitability * 0.2
 * Missing market data stays missing — never invent a price.
 */
export function recommendTerraSubCrops(
  input: TerraSubCropRecommendationInput
): TerraSubCropRecommendationOutput[] {
  const candidateCrops = [
    { name: 'Methi (Fenugreek)', idealTempMin: 15, idealTempMax: 30, substrateScore: 0.95 },
    { name: 'Palak (Spinach)', idealTempMin: 12, idealTempMax: 28, substrateScore: 0.90 },
    { name: 'Coriander (Dhania)', idealTempMin: 15, idealTempMax: 32, substrateScore: 0.88 },
    { name: 'Mint (Pudina)', idealTempMin: 18, idealTempMax: 35, substrateScore: 0.92 },
  ];

  return candidateCrops.map((crop) => {
    const priceData = input.mandiPrices.find((p) => p.cropName.toLowerCase().includes(crop.name.split(' ')[0].toLowerCase()));

    // Climate fit score
    let climateFit = 0.5;
    if (input.ambientTempC >= crop.idealTempMin && input.ambientTempC <= crop.idealTempMax) {
      climateFit = 1.0;
    } else if (Math.abs(input.ambientTempC - (crop.idealTempMin + crop.idealTempMax) / 2) <= 10) {
      climateFit = 0.7;
    }

    // Normalized price trend
    let normalizedTrend = 0.5;
    if (priceData && priceData.dataAvailable) {
      normalizedTrend = Math.min(1.0, Math.max(0.0, (priceData.priceTrend7dPct + 20) / 40));
    }

    const score = normalizedTrend * 0.5 + climateFit * 0.3 + crop.substrateScore * 0.2;

    return {
      cropName: crop.name,
      score: Math.round(score * 100) / 100,
      avgMandiPricePerKg: priceData && priceData.dataAvailable ? priceData.avgPricePerKg : null,
      priceTrend7dPct: priceData && priceData.dataAvailable ? priceData.priceTrend7dPct : null,
      climateFitScore: climateFit,
      substrateSuitability: crop.substrateScore,
      explainTrace: {
        priceComponent: priceData && priceData.dataAvailable
          ? `Price trend 7d: ${priceData.priceTrend7dPct}% -> normalized ${normalizedTrend.toFixed(2)} * 0.5`
          : 'Market price data UNSET / MISSING from Agmarknet API (no fabrication). Default baseline 0.5 * 0.5',
        climateComponent: `Temp ${input.ambientTempC}°C vs ideal window [${crop.idealTempMin}°C - ${crop.idealTempMax}°C] -> score ${climateFit} * 0.3`,
        substrateComponent: `Substrate compatibility -> ${crop.substrateScore} * 0.2`,
        formula: 'Final Score = PriceTrendWeight(0.5) + ClimateFitWeight(0.3) + SubstrateWeight(0.2)',
      },
    };
  }).sort((a, b) => b.score - a.score);
}

/**
 * Solar-Da CEA Crop Cycle Planner per ReservoirGroup
 * Ranking happens per reservoir group because incompatible crops cannot share one loop's chemistry.
 */
export function rankSolardaCeaCropsForReservoirGroup(
  input: SolardaCeaCropRecommendationInput
): SolardaCeaCropRecommendationOutput[] {
  const ceaProfiles: SolardaCeaCropProfile[] = [
    { cropName: 'Butterhead Lettuce', ecTargetMsCm: 1.8, phTarget: 5.8, dliTargetMolM2Day: 16, cycleDays: 35, expectedYieldKgPerPort: 0.25 },
    { cropName: 'Hydroponic Strawberries', ecTargetMsCm: 2.2, phTarget: 6.0, dliTargetMolM2Day: 20, cycleDays: 60, expectedYieldKgPerPort: 0.40 },
    { cropName: 'Italian Basil', ecTargetMsCm: 1.6, phTarget: 5.9, dliTargetMolM2Day: 14, cycleDays: 28, expectedYieldKgPerPort: 0.18 },
    { cropName: 'Arugula / Rocket', ecTargetMsCm: 1.5, phTarget: 6.0, dliTargetMolM2Day: 12, cycleDays: 25, expectedYieldKgPerPort: 0.15 },
  ];

  return ceaProfiles.map((crop) => {
    const ecDiff = Math.abs(crop.ecTargetMsCm - input.currentLoopEcMsCm);
    const phDiff = Math.abs(crop.phTarget - input.currentLoopPh);
    const isLoopCompatible = ecDiff <= 0.4 && phDiff <= 0.4;

    const loopCompatibilityScore = Math.max(0, 1.0 - (ecDiff * 1.5 + phDiff * 1.0));

    const priceData = input.mandiPrices.find((p) => p.cropName.toLowerCase().includes(crop.cropName.split(' ')[0].toLowerCase()));
    const pricePerKg = priceData && priceData.dataAvailable ? priceData.avgPricePerKg : 120; // Default ₹120/kg if missing

    const forecastRevenue = pricePerKg * crop.expectedYieldKgPerPort;
    const estKwh = (crop.dliTargetMolM2Day * 0.15 + 0.05) * crop.cycleDays;
    const energyCost = estKwh * input.energyCostPerKwhInr;
    const netMargin = forecastRevenue - energyCost;

    return {
      cropName: crop.cropName,
      rank: 0,
      loopCompatibilityScore: Math.round(loopCompatibilityScore * 100) / 100,
      estimatedCycleDays: crop.cycleDays,
      forecastRevenuePerPortInr: Math.round(forecastRevenue),
      estimatedEnergyCostPerPortInr: Math.round(energyCost),
      netMarginPerPortInr: Math.round(netMargin),
      isLoopCompatible,
      explainTrace: `EC target: ${crop.ecTargetMsCm} mS/cm vs loop ${input.currentLoopEcMsCm} mS/cm. pH target: ${crop.phTarget} vs loop ${input.currentLoopPh}. Energy cost computed at ₹${input.energyCostPerKwhInr}/kWh over ${crop.cycleDays} day cycle.`,
    };
  })
  .sort((a, b) => b.netMarginPerPortInr - a.netMarginPerPortInr)
  .map((rec, index) => ({ ...rec, rank: index + 1 }));
}
