import React from 'react';
import { recommendTerraSubCrops } from '@terrasub-solarda/engine';
import { TrendingUp, Info, MapPin, Award, Smartphone } from 'lucide-react';

export const CropRecommender: React.FC = () => {
  const recommendations = recommendTerraSubCrops({
    region: 'Tamil Nadu',
    ambientTempC: 27.5,
    mandiPrices: [
      { cropName: 'Methi', mandiName: 'Chennai Mandi', state: 'Tamil Nadu', avgPricePerKg: 45, priceTrend7dPct: 12.5, dataAvailable: true },
      { cropName: 'Palak', mandiName: 'Chennai Mandi', state: 'Tamil Nadu', avgPricePerKg: 35, priceTrend7dPct: -4.0, dataAvailable: true },
      { cropName: 'Coriander', mandiName: 'Chennai Mandi', state: 'Tamil Nadu', avgPricePerKg: 60, priceTrend7dPct: 8.0, dataAvailable: true },
    ],
  });

  return (
    <div className="bg-[#090b10] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <h2 className="font-display text-2xl font-extrabold text-white">Agmarknet Crop Recommender (Transparent Heuristic)</h2>
          </div>
          <p className="text-xs text-slate-400">
            SAMPLE mandi prices (hand-entered, not live data.gov.in; real series exists for onion only) — Formula: score = normalize(price_trend) × 0.5 + climate_fit × 0.3 + substrate_suitability × 0.2
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-slate-950 px-3.5 py-1.5 rounded-full border border-white/10 text-xs">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-200 font-semibold font-mono">Region: Tamil Nadu (Chennai Mandi, sample prices)</span>
        </div>
      </div>

      {/* Field Device Reference Showcase (Recommended Crops + Assistant Inquiry Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-950/80 p-5 rounded-2xl border border-white/10">
        <div className="md:col-span-4 flex justify-center">
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-[260px]">
            <img src="/media/831f72ec-b82d-4b7d-be7f-b9598aaf30e6.jpg" alt="Recommended Crops Device Mockup" className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-emerald-400 bg-slate-950/80 backdrop-blur p-1 rounded border border-white/10 text-center">
              Field Device: Methi, Palak, Arai Keerai + Assistant Inquiry
            </span>
          </div>
        </div>

        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Smartphone className="w-4 h-4" />
            <span className="eyebrow-quiet text-emerald-400">RECOMMENDED CROPS & ASSISTANT REFERENCE</span>
          </div>
          <h3 className="font-display text-lg font-bold text-white">Methi, Palak, & Arai Keerai Suitability Scoring</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Ranked list matching Chennai mandi market prices with ambient regional climate and substrate fit. Integrates assistant inquiry: "Is my EC too low for methi?"
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-white/10 text-xs text-slate-300 font-mono">
            Assistant: "EC is slightly low for optimal methi growth, but within an acceptable range."
          </div>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="bg-slate-950/90 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <h3 className="font-display text-lg font-bold text-white">{rec.cropName}</h3>
                </div>
                <span className="eyebrow-quiet block text-[10px] mt-1">Rank #{idx + 1} Recommendation</span>
              </div>
              <div className="text-right">
                <span className="font-display text-3xl font-black text-emerald-400 font-mono">{(rec.score * 100).toFixed(0)}</span>
                <span className="eyebrow-quiet block text-[9px]">Suitability Score</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-900 p-3.5 rounded-xl border border-white/5 text-xs font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block font-sans">Avg Mandi Price (sample)</span>
                <span className="font-bold text-white text-sm">
                  {rec.avgMandiPricePerKg ? `₹${rec.avgMandiPricePerKg}/kg` : 'Data Unavailable'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block font-sans">7-Day Price Trend</span>
                <span className={`font-bold text-sm ${rec.priceTrend7dPct && rec.priceTrend7dPct > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {rec.priceTrend7dPct ? `${rec.priceTrend7dPct > 0 ? '+' : ''}${rec.priceTrend7dPct}%` : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-900/60 p-3.5 rounded-xl border border-white/5 text-[11px] text-slate-300 font-mono">
              <div className="flex items-center space-x-1 text-cyan-400 font-sans font-bold text-[10px] uppercase tracking-wider">
                <Info className="w-3.5 h-3.5" />
                <span>Explain Traceability Breakdown</span>
              </div>
              <div>• {rec.explainTrace.priceComponent}</div>
              <div>• {rec.explainTrace.climateComponent}</div>
              <div>• {rec.explainTrace.substrateComponent}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
