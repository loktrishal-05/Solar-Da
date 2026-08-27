export interface PowerTelemetry {
  solarPowerWatts: number;
  batterySocPct: number; // 0..100%
  batteryReserveFloorPct: number; // e.g. 20%
  isGridAvailable: boolean;
}

export interface PowerScheduleResult {
  allowSupplementalLighting: boolean;
  allowNonCriticalClimate: boolean;
  allowDosingPumps: boolean;
  allowCirculationPump: boolean; // MANDATORY TRUE - NEVER SHED
  currentMode: 'SOLAR_OPTIMAL' | 'BATTERY_CONSERVATION' | 'CRITICAL_LOAD_SHED';
  explainTrace: string;
}

/**
 * Solar-first Power Scheduler with Fixed Load-Shedding Cascade:
 * lighting sheds first → non-critical climate → dosing.
 * Circulation pump is an interlock property and is NEVER shed below root-safety minimum.
 */
export function calculatePowerSchedule(power: PowerTelemetry): PowerScheduleResult {
  const isSolarPeak = power.solarPowerWatts > 300;
  const isBatteryHealthy = power.batterySocPct > power.batteryReserveFloorPct;

  // RULE 1: Minimum circulation duty is an INTERLOCK, not a scheduling preference.
  const allowCirculationPump = true;

  if (isSolarPeak || (power.isGridAvailable && isBatteryHealthy)) {
    return {
      allowSupplementalLighting: true,
      allowNonCriticalClimate: true,
      allowDosingPumps: true,
      allowCirculationPump,
      currentMode: 'SOLAR_OPTIMAL',
      explainTrace: `Full power available (Solar: ${power.solarPowerWatts}W, Battery: ${power.batterySocPct}%). All systems active.`,
    };
  }

  if (isBatteryHealthy) {
    // Stage 1 Load Shed: Shed supplemental lighting first
    return {
      allowSupplementalLighting: false,
      allowNonCriticalClimate: true,
      allowDosingPumps: true,
      allowCirculationPump,
      currentMode: 'BATTERY_CONSERVATION',
      explainTrace: `Solar output drop detected (${power.solarPowerWatts}W). Load shed stage 1 applied: Supplemental lighting disabled. Circulation & dosing active.`,
    };
  }

  // Critical Low Power: Shed lighting, non-critical climate, and dosing pumps.
  // Circulation pump remains MANDATORY ON due to safety interlock.
  return {
    allowSupplementalLighting: false,
    allowNonCriticalClimate: false,
    allowDosingPumps: false,
    allowCirculationPump, // MUST STAY TRUE
    currentMode: 'CRITICAL_LOAD_SHED',
    explainTrace: `CRITICAL POWER LOW (Battery ${power.batterySocPct}% <= reserve floor ${power.batteryReserveFloorPct}%). Load shed stage 2 applied: Lighting, climate, and dosing shed. Minimum root circulation maintained per safety interlock.`,
  };
}
