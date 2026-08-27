import React from 'react';
import { rankSolardaCeaCropsForReservoirGroup } from '@terrasub-solarda/engine';
import { Calendar, DollarSign, Zap, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const CeaCropPlanner: React.FC = () => {
  const ceaPlan = rankSolardaCeaCropsForReservoirGroup({
    reservoirGroupId: 'res_group_alpha',
    currentLoopEcMsCm: 1.75,
    currentLoopPh: 5.85,
    dailyLightIntegralMolM2Day: 16,
    energyCostPerKwhInr: 7.5,
    mandiPrices: [
      { cropName: 'Butterhead', mandiName: 'Bangalore Mandi', state: 'Karnataka', avgPricePerKg: 140, priceTrend7dPct: 5.0, dataAvailable: true },
      { cropName: 'Strawberry', mandiName: 'Bangalore Mandi', state: 'Karnataka', avgPricePerKg: 350, priceTrend7dPct: 15.0, dataAvailable: true },
      { cropName: 'Basil', mandiName: 'Bangalore Mandi', state: 'Karnataka', avgPricePerKg: 180, priceTrend7dPct: 2.0, dataAvailable: true },
    ],
  });

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-sky-400" />
            <h2 className="text-xl font-bold text-white">CEA Crop Cycle Planner (ReservoirGroup Scoped)</h2>
          </div>
          <p className="text-xs text-slate-400">
            Ranking happens per reservoir group because incompatible crops cannot share one loop's EC/pH chemistry. Nets cultivation cost (energy) against forecast price.
          </p>
        </div>
        <span className="px-3 py-1 bg-sky-950 text-sky-300 border border-sky-700 text-xs font-bold rounded-lg font-mono">
          Loop EC: 1.75 | pH: 5.85
        </span>
      </div>

      {/* CEA Ranked Crop List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ceaPlan.map((crop) => (
          <div
            key={crop.cropName}
            className={`p-5 rounded-xl border space-y-4 shadow-md ${
              crop.isLoopCompatible ? 'bg-slate-900/90 border-slate-700' : 'bg-slate-950/60 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-sky-900 text-sky-300 font-bold text-xs flex items-center justify-center border border-sky-700">
                    #{crop.rank}
                  </span>
                  <h3 className="text-base font-bold text-white">{crop.cropName}</h3>
                </div>
                <span className="text-xs text-slate-400 block mt-0.5">Cycle: {crop.estimatedCycleDays} Days</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-400 font-mono">₹{crop.netMarginPerPortInr}</span>
                <span className="text-[10px] text-slate-400 block">Net Margin / Port</span>
              </div>
            </div>

            {/* Loop Chemistry Compatibility Pill */}
            <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-800 border border-slate-700">
              <span className="text-slate-400 font-medium">Loop Compatibility:</span>
              <span className={`font-bold flex items-center gap-1 ${crop.isLoopCompatible ? 'text-emerald-400' : 'text-amber-400'}`}>
                {crop.isLoopCompatible ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {crop.isLoopCompatible ? 'Compatible Chemistry' : 'Incompatible EC/pH Loop'}
              </span>
            </div>

            {/* Economics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 text-[10px] block font-sans">Forecast Revenue / Port</span>
                <span className="text-white font-bold">₹{crop.forecastRevenuePerPortInr}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block font-sans">Est Energy Cost / Port</span>
                <span className="text-rose-400 font-bold">₹{crop.estimatedEnergyCostPerPortInr}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
