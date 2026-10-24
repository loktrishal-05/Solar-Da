import { store } from './store.js';
import { ActuatorCommandProposal } from '@terrasub-solarda/engine';

export interface ChatRequestTurn {
  sessionId: string;
  userMessage: string;
  contentType?: 'text' | 'image' | 'voice';
  imageUrl?: string;
  idempotencyKey?: string;
}

export interface ChatResponseTurn {
  sessionId: string;
  assistantResponse: string;
  proposalsGenerated: ActuatorCommandProposal[];
  redTeamBlocked: boolean;
  citationSources: string[];
}

/**
 * Single In-Process Policy-Controlled Gateway for Gemini API
 * Enforces Invariant 1: Tools ONLY create PROPOSALS. Direct execution is structurally blocked.
 */
export async function processGeminiAssistantTurn(request: ChatRequestTurn): Promise<ChatResponseTurn> {
  const textLower = request.userMessage.toLowerCase();
  const citations: string[] = ['Keyword rules, not an LLM (the Farm assistant tab uses Gemini)'];

  // RED-TEAM ADVERSARIAL PROMPT INJECTION INSPECTION (Section 4.10 & 4.19 Item 7)
  const injectionPatterns = [
    'bypass interlocks',
    'override safety',
    'execute immediately without confirmation',
    'force dose pump on',
    'ignore human confirmation',
    'system prompt override',
  ];

  const hasInjection = injectionPatterns.some((pattern) => textLower.includes(pattern));
  if (hasInjection) {
    store.auditLogs.push({
      id: `audit_redteam_${Date.now()}`,
      timestampMs: Date.now(),
      action: 'RED_TEAM_PROMPT_INJECTION_BLOCKED',
      actor: 'GEMINI_GATEWAY_POLICY_CHECK',
      status: 'VETOED',
      details: `Blocked adversarial prompt injection payload attempting physical execution override: "${request.userMessage}"`,
    });

    return {
      sessionId: request.sessionId,
      assistantResponse:
        'SECURITY POLICY VETO: The assistant gateway detected an unauthorized prompt injection or physical execution override attempt. As a hard safety invariant, all physical actuations require human confirmation via the UI control surface.',
      proposalsGenerated: [],
      redTeamBlocked: true,
      citationSources: ['Platform Invariant Rule 1: No direct physical execution by AI'],
    };
  }

  // Intent Recognition & Tool Calls (Proposals Only!)
  const proposalsGenerated: ActuatorCommandProposal[] = [];
  let assistantResponse = '';

  if (textLower.includes('dose') || textLower.includes('water') || textLower.includes('irrigate') || textLower.includes('topup')) {
    citations.push('Live Sensor Telemetry', 'Reservoir Safety Limits KB');
    const resGroup = store.reservoirGroups[0];
    const proposal: ActuatorCommandProposal = {
      id: `prop_gemini_${Date.now()}`,
      reservoirGroupId: resGroup.id,
      actuatorType: textLower.includes('water') ? 'WATER_PUMP' : 'NUTRIENT_DOSE_PUMP',
      targetValue: textLower.includes('water') ? 20 : 10,
      unit: textLower.includes('water') ? 'SEC' : 'ML',
      reason: `Proposed via Gemini Assistant turn for user request: "${request.userMessage}"`,
      idempotencyKey: request.idempotencyKey || `key_gemini_${Date.now()}`,
      expiresAtMs: Date.now() + 1800000,
      requiresHumanConfirmation: true, // MANDATORY SAFETY INVARIANT
      proposedBy: 'ASSISTANT_TOOL',
      autonomyLevel: resGroup.autonomyLevel,
    };

    proposalsGenerated.push(proposal);
    store.proposals.push(proposal);

    assistantResponse = `I have generated a proposal (${proposal.actuatorType} ${proposal.targetValue}${proposal.unit}) for ${resGroup.label}.\n\n` +
      `**Safety Boundary Notice:** Per platform rules, I cannot directly execute physical actions. Please review and tap 'Confirm Proposal' in the Fertigation Control surface to proceed.`;
  } else if (textLower.includes('status') || textLower.includes('reading') || textLower.includes('ec')) {
    citations.push('Solution Telemetry Hypertable', 'Uptake Ratio Engine');
    if (store.mode === 'TERRASUB_MVP') {
      const gu = store.growUnits[0];
      const r = gu.readings[gu.readings.length - 1];
      assistantResponse = `**TerraSub Status (${gu.label}):**\n- Moisture: **${r.moisturePct}%** (Threshold: ${gu.moistureThresholdLow}%)\n- EC: **${r.ecMsCm} mS/cm** (Target: ${gu.targetEcMsCm})\n- pH: **${r.ph}**\n- Temperature: **${r.ambientTempC}°C**\n\n*Note: NPK readings are trend proxies validated against lab baseline.*`;
    } else {
      const rg = store.reservoirGroups[0];
      assistantResponse = `**Solar-Da v3 Status (${rg.label}):**\n- EC: **${rg.currentEcMsCm} mS/cm**\n- pH: **${rg.currentPh}**\n- DO: **${rg.currentDoMgL} mg/L**\n- Solution Temp: **${rg.currentTempC}°C**\n- Mass: **${rg.massGrams} g**\n- Autonomy Level: **${rg.autonomyLevel}**`;
    }
  } else if (textLower.includes('recipe') || textLower.includes('substrate') || textLower.includes('gelatin')) {
    citations.push('Substrate Recipe Calculator', 'TN Vellore-Ranipet Heavy Metal Safety Standard');
    assistantResponse = `**TerraSub Substrate Formula (2L Reference Batch):**\n- Hydrated Coco Coir: **1,100 ml**\n- Mature Vermicompost: **500 ml**\n- Biochar/Perlite: **200 ml**\n- Neem Cake Powder: **100 ml**\n- Bone Meal / Eggshell: **50 ml**\n- Gelatin Solution: **10g bloomed in 40ml cold water, dissolved in 150ml warm water**\n\n**CRITICAL SAFETY MANDATE:** Gelatin MUST be fish- or poultry-derived only. Never tannery-derived waste!`;
  } else {
    citations.push('Platform Knowledge Base v3');
    assistantResponse = `I am your Agronomic Intelligence Assistant for ${store.mode === 'TERRASUB_MVP' ? 'TerraSub' : 'Solar-Da v3'}.\n\nHow can I help you understand crop uptake, run diagnostic photo scans, adjust safety setpoints, or review proposals today?`;
  }

  return {
    sessionId: request.sessionId,
    assistantResponse,
    proposalsGenerated,
    redTeamBlocked: false,
    citationSources: citations,
  };
}
