import React, { useState } from 'react';
import { calculatePowerSchedule, PowerScheduleResult } from '@terrasub-solarda/engine';
import { Sun, BatteryCharging, Zap, ShieldAlert, CheckCircle2, ArrowDown } from 'lucide-react';

export const PowerSchedulerView: React.FC = () => {
  const [solarWatts, setSolarWatts] = useState<number>(420);
  const [batterySoc, setBatterySoc] = useState<number>(85);
  const [isGridAvailable, setIsGridAvailable] = useState<boolean>(true);

  const schedule: PowerScheduleResult = calculatePowerSchedule({
    solarPowerWatts: solarWatts,
    batterySocPct: batterySoc,
    batteryReserveFloorPct: 20,
    isGridAvailable,
  });

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sun className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Hybrid Solar-First Power Model & Load Shedding</h2>
          </div>
          <p className="text-xs text-slate-400">
            Solar-first scheduling — Circulation and light top-up prefer solar generation window. Fixed load-shed cascade.
          </p>
        </div>
        <span className={`px-3 py-1 text-xs font-bold rounded-lg border font-mono ${
          schedule.currentMode === 'SOLAR_OPTIMAL' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-amber-950 text-amber-300 border-amber-700'
        }`}>
          Mode: {schedule.currentMode}
        </span>
      </div>

      {/* Telemetry Input Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Solar PV Output (Watts)</label>
          <input
            type="number"
            value={solarWatts}
            onChange={(e) => setSolarWatts(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Battery SOC (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={batterySoc}
            onChange={(e) => setBatterySoc(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Grid Power Connection</label>
          <button
            onClick={() => setIsGridAvailable(!isGridAvailable)}
            className={`w-full py-1.5 rounded-lg text-xs font-bold transition border ${
              isGridAvailable ? 'bg-emerald-900/60 text-emerald-300 border-emerald-600' : 'bg-rose-900/60 text-rose-300 border-rose-600'
            }`}
          >
            {isGridAvailable ? 'Grid Available' : 'Grid Offline'}
          </button>
        </div>
      </div>

      {/* Fixed Load-Shedding Cascade Status Grid */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Fixed Load-Shedding Cascade (Shed Priority Order)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Supplemental Lighting (Sheds 1st) */}
          <div className={`p-4 rounded-xl border text-center space-y-1 ${schedule.allowSupplementalLighting ? 'bg-emerald-950/60 border-emerald-600' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <span className="text-xs font-bold block">1. Supplemental LED Lighting</span>
            <span className={`text-sm font-black ${schedule.allowSupplementalLighting ? 'text-emerald-400' : 'text-rose-400'}`}>
              {schedule.allowSupplementalLighting ? 'ACTIVE' : 'SHED 1st'}
            </span>
          </div>

          {/* Non-critical climate (Sheds 2nd) */}
          <div className={`p-4 rounded-xl border text-center space-y-1 ${schedule.allowNonCriticalClimate ? 'bg-emerald-950/60 border-emerald-600' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <span className="text-xs font-bold block">2. Non-Critical Climate Fans</span>
            <span className={`text-sm font-black ${schedule.allowNonCriticalClimate ? 'text-emerald-400' : 'text-rose-400'}`}>
              {schedule.allowNonCriticalClimate ? 'ACTIVE' : 'SHED 2nd'}
            </span>
          </div>

          {/* Dosing Pumps (Sheds 3rd) */}
          <div className={`p-4 rounded-xl border text-center space-y-1 ${schedule.allowDosingPumps ? 'bg-emerald-950/60 border-emerald-600' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <span className="text-xs font-bold block">3. Fertilizer Dosing Pumps</span>
            <span className={`text-sm font-black ${schedule.allowDosingPumps ? 'text-emerald-400' : 'text-rose-400'}`}>
              {schedule.allowDosingPumps ? 'ACTIVE' : 'SHED 3rd'}
            </span>
          </div>

          {/* MANDATORY CIRCULATION PUMP (NEVER SHED) */}
          <div className="p-4 rounded-xl border border-sky-500 bg-sky-950/80 text-center space-y-1 ring-2 ring-sky-400/50">
            <span className="text-xs font-bold block text-sky-200">4. Minimum Circulation Pump</span>
            <span className="text-sm font-black text-sky-300 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-sky-400" /> MANDATORY ON
            </span>
            <span className="text-[9px] text-sky-400 block font-semibold">Root Safety Interlock Floor</span>
          </div>
        </div>

        <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-xs text-slate-300 font-mono">
          Explain: {schedule.explainTrace}
        </div>
      </div>
    </div>
  );
};
