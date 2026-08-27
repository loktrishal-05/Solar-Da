import { GelatinSourceValidation, SubstrateRecipeRequest, SubstrateRecipeResult } from './types.js';

export function validateGelatinSource(source: SubstrateRecipeRequest['gelatinSource']): GelatinSourceValidation {
  if (source === 'TANNERY') {
    return {
      source,
      isValid: false,
      safetyWarning:
        'CRITICAL SAFETY VIOLATION: Tannery-derived gelatin is STRICTLY PROHIBITED due to documented heavy metal (Hexavalent Chromium) contamination risk (e.g. Vellore-Ranipet belt industrial waste). Only fish- or poultry-derived gelatin is permitted.',
    };
  }

  if (source === 'FISH' || source === 'POULTRY') {
    return {
      source,
      isValid: true,
    };
  }

  return {
    source,
    isValid: false,
    safetyWarning: 'UNVERIFIED GELATIN SOURCE: Only certified fish- or poultry-derived gelatin/collagen is permitted for substrate safety.',
  };
}

export function calculateSubstrateRecipe(request: SubstrateRecipeRequest): SubstrateRecipeResult {
  const gelatinValidation = validateGelatinSource(request.gelatinSource);
  const scale = Math.max(0.1, request.targetVolumeLiters / 2.0); // Baseline batch is 2.0 Liters
  const trialType = request.trialType || 'FORMULA';

  let gelatinGrams = 10 * scale;
  let coldWaterMl = 40 * scale;
  let warmWaterMl = 150 * scale;

  if (trialType === 'CONTROL') {
    return {
      targetVolumeLiters: request.targetVolumeLiters,
      ingredients: {
        cocoCoirMl: 2000 * scale,
        vermicompostMl: 0,
        riceHuskBiocharMl: 0,
        neemCakePowderMl: 0,
        boneMealMl: 0,
        gelatinGrams: 0,
        coldWaterMl: 0,
        warmWaterMl: 0,
      },
      gelatinValidation,
      prepSequence: [
        'CONTROL TRAY PREP: Hydrate pure coco coir with plain water.',
        'Pack coir into mesh sleeve.',
        'Place in horizontal gutter baseline control slot.',
      ],
      cautions: ['Control baseline contains no added nutrients or collagen binder.'],
      trialType,
    };
  }

  if (trialType === 'ISOLATION_NO_GELATIN') {
    gelatinGrams = 0;
    coldWaterMl = 0;
    warmWaterMl = 0;
  }

  return {
    targetVolumeLiters: request.targetVolumeLiters,
    ingredients: {
      cocoCoirMl: Math.round(1100 * scale),
      vermicompostMl: Math.round(500 * scale),
      riceHuskBiocharMl: Math.round(200 * scale),
      neemCakePowderMl: Math.round(100 * scale),
      boneMealMl: Math.round(50 * scale),
      gelatinGrams: Math.round(gelatinGrams * 10) / 10,
      coldWaterMl: Math.round(coldWaterMl),
      warmWaterMl: Math.round(warmWaterMl),
    },
    gelatinValidation,
    prepSequence: [
      '1. Confirm vermicompost is fully matured (dark, crumbly, no visible scraps).',
      '2. Hydrate coir with clean water until fully expanded.',
      trialType === 'ISOLATION_NO_GELATIN'
        ? '3. Skip gelatin solution (Isolation Trial mode).'
        : `3. Bloom ${Math.round(gelatinGrams * 10) / 10}g fish/poultry gelatin in ${Math.round(coldWaterMl)}ml cold water (5 mins), then dissolve in ${Math.round(warmWaterMl)}ml warm (not boiling) water.`,
      '4. Thoroughly mix dry ingredients: coir, vermicompost, biochar, neem cake, bone meal.',
      '5. Fold in gelatin solution until substrate reaches damp-sponge consistency (no water runoff when squeezed).',
      '6. Pack substrate firmly into jute/coir mesh sleeve.',
      '7. Lay sleeve flat into horizontal grow gutter.',
    ],
    cautions: [
      'SAFETY MANDATE: Ensure gelatin is fish- or poultry-derived. Never use tannery-derived waste material.',
      'Do not boil water above 70°C when dissolving gelatin, as extreme heat denatures collagen structure.',
    ],
    trialType,
  };
}
