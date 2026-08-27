import React, { useState } from 'react';
import { calculateNutrientUptakeRatio, UptakeRatioResult } from '@terrasub-solarda/engine';
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export const UptakeRatioVisualizer: React.FC = () => {
  const [initialMass, setInitialMass] = useState<number>(50000);
  const [finalMass, setFinalMass] = useState<number>(48500); // -1500g transpiration
  const [initialEc, setInitialEc] = useState<number>(1.80);
  const [finalEc, setFinalEc] = useState<number>(1.65); // -0.15 mS/cm uptake

  const result: UptakeRatioResult = calculateNutrientUptakeRatio(
    initialMass,
    finalMass,
    initialEc,
    finalEc
  );

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Signature Diagnostic — Nutrient Uptake Ratio</h2>
          </div>
          <p className="text-xs text-slate-400">
            Computes crop uptake state from Δ EC against Δ Mass (Load cell vs probe delta correlation). Structural asset of bounded sealed reservoirs.
          </p>
        </div>
        <span className="px-3 py-1 bg-slate-900 border border-slate-700 text-xs font-mono text-yellow-300 rounded-lg">
          Mass Delta: {result.deltaMassGrams}g | EC Delta: {result.deltaEcMsCm.toFixed(3)} mS/cm
        </span>
      </div>

      {/* Interactive Simulation Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-700">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Initial Mass (g)</label>
          <input
            type="number"
            value={initialMass}
            onChange={(e) => setInitialMass(parseFloat(e.target.value) || 50000)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Final Mass (g)</label>
          <input
            type="number"
            value={finalMass}
            onChange={(e) => setFinalMass(parseFloat(e.target.value) || 48500)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Initial EC (mS/cm)</label>
          <input
            type="number"
            step="0.05"
            value={initialEc}
            onChange={(e) => setInitialEc(parseFloat(e.target.value) || 1.8)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Final EC (mS/cm)</label>
          <input
            type="number"
            step="0.05"
            value={finalEc}
            onChange={(e) => setFinalEc(parseFloat(e.target.value) || 1.65)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
          />
        </div>
      </div>

      {/* Diagnostic Quadrant Graph & Result Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quadrant Map */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-3 text-center">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Uptake Ratio Quadrant Map</h3>
          <div className="grid grid-cols-2 gap-2 h-48">
            <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${result.diagnosis === 'WATER_DEPLETION' ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-400' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <ArrowUpRight className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">Mass ↓, EC ↑</span>
              <span className="text-[10px]">Water Depletion</span>
            </div>
            <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${result.diagnosis === 'NUTRIENT_UPTAKE' ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-400 text-emerald-200' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <ArrowDownRight className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">Mass ↓, EC ↓</span>
              <span className="text-[10px]">Active Nutrient Uptake</span>
            </div>
            <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${result.diagnosis === 'ANOMALY_OR_LEAK' ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-400 text-rose-200 animate-pulse' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <ShieldAlert className="w-5 h-5 mb-1 text-rose-400" />
              <span className="text-xs font-bold">Mass ~Flat, EC ↓</span>
              <span className="text-[10px]">Leak / Anomaly (NO DOSE)</span>
            </div>
            <div className={`p-3 rounded-lg border flex flex-col justify-center items-center ${result.diagnosis === 'STABLE' ? 'bg-sky-950/80 border-sky-500 ring-2 ring-sky-400 text-sky-200' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <CheckCircle2 className="w-5 h-5 mb-1" />
              <span className="text-xs font-bold">Mass Flat, EC Flat</span>
              <span className="text-[10px]">Stable Balance</span>
            </div>
          </div>
        </div>

        {/* Diagnosis Output Card */}
        <div className="bg-slate-900/90 p-5 rounded-xl border border-slate-700 space-y-4 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider mb-1">Diagnostic Output</span>
            <div className="text-xl font-black text-white flex items-center space-x-2">
              <span>{result.diagnosis}</span>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{result.explanation}</p>
          </div>

          <div className="p-3.5 bg-slate-800 rounded-lg border border-slate-700 text-xs space-y-1">
            <span className="font-bold text-sky-300 block">Recommended Control Action</span>
            <span className="text-slate-200">{result.recommendedAction}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 font-mono">
            <span className="text-slate-400">Nutrient Dosing Allowed:</span>
            <span className={`font-bold ${result.canDoseNutrient ? 'text-emerald-400' : 'text-rose-400'}`}>
              {result.canDoseNutrient ? 'YES — Safe to Dose' : 'NO — Dosing Restricted'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
