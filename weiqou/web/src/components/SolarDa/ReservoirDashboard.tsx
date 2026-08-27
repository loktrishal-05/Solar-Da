import React from 'react';
import { REQUIRED_DOSING_SEQUENCE } from '@terrasub-solarda/engine';
import { Cpu, Zap, Activity, Droplet, Thermometer, Scale, Layers, CheckCircle2, Shield } from 'lucide-react';

export const ReservoirDashboard: React.FC = () => {
  const currentStepIndex = 3; // Step: DOSE_NUTRIENT in sequence

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">Solar-Da v3 Reservoir Group & Tower Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400">
            Reservoir Loop Alpha — 6 Vertical Aeroponic Towers (Butterhead Lettuce, NFT/Aeroponic Loop)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-sky-950 text-sky-300 border border-sky-700 text-xs font-bold rounded-lg font-mono">
            Autonomy: L2 Supervised
          </span>
        </div>
      </div>

      {/* Primary Telemetry Metrics Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {/* Solution EC */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
          <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-yellow-400" /> Electrical Cond.
          </span>
          <span className="text-2xl font-black text-yellow-300">1.75</span>
          <span className="text-[10px] text-slate-400 block">mS/cm (Target 1.8)</span>
        </div>

        {/* Solution pH */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
          <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
            <Activity className="w-4 h-4 text-emerald-400" /> Solution pH
          </span>
          <span className="text-2xl font-black text-emerald-300">5.85</span>
          <span className="text-[10px] text-slate-400 block">Target [5.5 - 6.5]</span>
        </div>

        {/* Dissolved Oxygen */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
          <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
            <Droplet className="w-4 h-4 text-cyan-400" /> Dissolved O₂
          </span>
          <span className="text-2xl font-black text-cyan-300">6.8</span>
          <span className="text-[10px] text-slate-400 block">mg/L (Floor: 5.0)</span>
        </div>

        {/* Solution Temp */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
          <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
            <Thermometer className="w-4 h-4 text-rose-400" /> Solution Temp
          </span>
          <span className="text-2xl font-black text-rose-300">21.5°C</span>
          <span className="text-[10px] text-slate-400 block">Ceiling: 24.0°C</span>
        </div>

        {/* Reservoir Mass */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
          <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
            <Scale className="w-4 h-4 text-purple-400" /> Reservoir Mass
          </span>
          <span className="text-2xl font-black text-purple-300">48.5</span>
          <span className="text-[10px] text-slate-400 block">kg (Load Cell)</span>
        </div>

        {/* Reservoir Level */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-center space-y-1">
          <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
            <Layers className="w-4 h-4 text-blue-400" /> Solution Level
          </span>
          <span className="text-2xl font-black text-blue-300">420</span>
          <span className="text-[10px] text-slate-400 block">mm (Floor 150mm)</span>
        </div>
      </div>

      {/* FIXED DOSING OPERATION SEQUENCE BAR (§1.7) */}
      <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <Shield className="w-4 h-4 text-sky-400" />
            <span>Fixed Dosing Safety Operation Sequence</span>
          </h3>
          <span className="text-[11px] text-sky-300 font-mono">Mandatory Invariant Order</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 text-center text-[10px]">
          {REQUIRED_DOSING_SEQUENCE.map((step, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-lg border font-semibold flex flex-col items-center justify-center transition-all ${
                idx === currentStepIndex
                  ? 'bg-sky-600 text-white border-sky-400 ring-2 ring-sky-300/50 animate-pulse'
                  : idx < currentStepIndex
                  ? 'bg-slate-800 text-emerald-400 border-emerald-600/50'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              <span className="font-mono text-[9px] block">Step {idx + 1}</span>
              <span className="truncate w-full">{step.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
