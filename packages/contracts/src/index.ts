import { z } from 'zod';

export const TelemetryIngestSchema = z.object({
  growUnitId: z.string().optional(),
  reservoirGroupId: z.string().optional(),
  moisturePct: z.number().min(0).max(100).optional(),
  ecMsCm: z.number().min(0).max(20),
  ph: z.number().min(0).max(14),
  doMgL: z.number().min(0).max(20).optional(),
  solutionTempC: z.number().min(-10).max(60).optional(),
  massGrams: z.number().min(0).optional(),
  levelMm: z.number().min(0).optional(),
  ambientTempC: z.number().min(-20).max(60).optional(),
  relativeHumidityPct: z.number().min(0).max(100).optional(),
  qualityStatus: z.enum(['VALID', 'SUSPECT', 'STALE', 'MISSING', 'IMPLAUSIBLE', 'CALIBRATION_BLOCKED']).default('VALID'),
});

export const ProposalConfirmationSchema = z.object({
  proposalId: z.string(),
  confirmedByUserId: z.string(),
  userRole: z.enum(['GROWER', 'AGRONOMIST', 'ADMIN', 'BUYER', 'AGGREGATOR', 'SUPPORT_OPERATOR']),
  overrideReason: z.string().optional(),
});

export const SubstrateRecipeSchema = z.object({
  targetVolumeLiters: z.number().positive(),
  gelatinSource: z.enum(['FISH', 'POULTRY', 'TANNERY', 'OTHER']),
  trialType: z.enum(['CONTROL', 'BENCHMARK', 'FORMULA', 'ISOLATION_NO_GELATIN']).optional(),
});

export const DiseaseReportSchema = z.object({
  growUnitId: z.string().optional(),
  reservoirGroupId: z.string().optional(),
  imageUrl: z.string().url().or(z.string().startsWith('data:image/')),
  imageTarget: z.enum(['CANOPY', 'ROOT_PORT']).default('CANOPY'),
  qualityScore: z.number().min(0).max(1).default(0.9),
});

export const ChatMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string().min(1),
  contentType: z.enum(['text', 'image', 'voice']).default('text'),
  imageUrl: z.string().optional(),
  growUnitId: z.string().optional(),
  reservoirGroupId: z.string().optional(),
});

export const MarketplaceListingSchema = z.object({
  cropName: z.string().min(1),
  quantityKg: z.number().positive(),
  pricePerKg: z.number().positive(),
  harvestLotId: z.string(),
  location: z.string(),
});

export type TelemetryIngest = z.infer<typeof TelemetryIngestSchema>;
export type ProposalConfirmation = z.infer<typeof ProposalConfirmationSchema>;
export type SubstrateRecipeInput = z.infer<typeof SubstrateRecipeSchema>;
export type DiseaseReportInput = z.infer<typeof DiseaseReportSchema>;
export type ChatMessageInput = z.infer<typeof ChatMessageSchema>;
export type MarketplaceListingInput = z.infer<typeof MarketplaceListingSchema>;
export * from './agent.js';
