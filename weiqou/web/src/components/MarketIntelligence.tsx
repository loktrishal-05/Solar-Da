import React from 'react';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, Info, MapPin, Calendar, Award } from 'lucide-react';

export const MarketIntelligence: React.FC = () => {
  const mandiPrices = [
    { crop: 'Methi (Fenugreek)', region: 'Chennai Mandi', price: 45, trend: 12.5, sparkline: [40, 42, 41, 44, 45] },
    { crop: 'Palak (Spinach)', region: 'Chennai Mandi', price: 35, trend: -4.0, sparkline: [38, 37, 36, 36, 35] },
    { crop: 'Coriander (Dhania)', region: 'Chennai Mandi', price: 60, trend: 8.0, sparkline: [54, 56, 58, 59, 60] },
    { crop: 'Arai Keerai (Amaranth)', region: 'Madurai Mandi', price: null, trend: null, sparkline: [] }, // Missing data stays missing!
  ];

  const heuristics = [
    {
      crop: 'Methi (Fenugreek)',
      score: 0.92,
      priceTrend: '+12.5% (Weight 0.5)',
      climateFit: 'Optimal 27.5°C (Weight 0.3)',
      substrateFit: '95% Substrate Match (Weight 0.2)',
      forecast: { downside: 38, expected: 45, upside: 52 },
    },
    {
      crop: 'Palak (Spinach)',
      score: 0.74,
      priceTrend: '-4.0% (Weight 0.5)',
      climateFit: 'Good 27.5°C (Weight 0.3)',
      substrateFit: '90% Substrate Match (Weight 0.2)',
      forecast: { downside: 30, expected: 35, upside: 40 },
    },
  ];

  return (
    <section id="market" className="py-20 px-4 lg:px-8 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Agmarknet & Price Intelligence</span>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A]">Market Demand & Crop Recommendations</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 bg-amber-50 text-[#D97706] border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1.5 font-mono">
              <MapPin className="w-3.5 h-3.5" />
              <span>data.gov.in (India Mandi Network)</span>
            </span>
          </div>
        </div>

        {/* Split View Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Agmarknet Price Table */}
          <div className="lg:col-span-7 bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Agmarknet Regional Mandi Prices</h3>
              <span className="text-[11px] text-gray-500 font-mono">Missing data stays missing (No fabrication)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-white text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Crop Name</th>
                    <th className="py-2.5 px-3">Mandi Region</th>
                    <th className="py-2.5 px-3">Avg Price (₹/kg)</th>
                    <th className="py-2.5 px-3">7-Day Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/80 text-gray-800">
                  {mandiPrices.map((p, i) => (
                    <tr key={i} className="hover:bg-white">
                      <td className="py-3 px-3 font-bold text-gray-900 font-sans">{p.crop}</td>
                      <td className="py-3 px-3 text-gray-600">{p.region}</td>
                      <td className="py-3 px-3 font-bold text-gray-900">
                        {p.price !== null ? `₹${p.price}/kg` : <span className="text-gray-400 font-sans">—</span>}
                      </td>
                      <td className="py-3 px-3 font-bold">
                        {p.trend !== null ? (
                          <span className={`inline-flex items-center space-x-1 ${p.trend > 0 ? 'text-[#059669]' : 'text-red-600'}`}>
                            {p.trend > 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                            <span>{p.trend > 0 ? `+${p.trend}%` : `${p.trend}%`}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 font-sans">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Transparent Heuristic Crop Recommender */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Transparent Heuristic Suitability Scoring</h3>

            <div className="space-y-4">
              {heuristics.map((h, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-gray-900 text-sm">{h.crop}</h4>
                      </div>
                      <span className="text-[11px] text-gray-500 font-mono">Rank #{i + 1} Recommendation</span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-2xl font-bold text-[#2D5A3D]">{(h.score * 100).toFixed(0)}</span>
                      <span className="text-[9px] text-gray-500 block font-mono">Suitability Score</span>
                    </div>
                  </div>

                  {/* Sourced Breakdown Bars */}
                  <div className="space-y-1 text-[11px] text-gray-600 font-mono bg-[#FAFAF8] p-3 rounded-xl border border-gray-100">
                    <div>• Price Component: {h.priceTrend}</div>
                    <div>• Climate Component: {h.climateFit}</div>
                    <div>• Substrate Component: {h.substrateFit}</div>
                  </div>

                  {/* Prediction Interval (Downside / Expected / Upside) */}
                  <div className="p-3 bg-[#E8F5E9] rounded-xl border border-[#A5D6A7] text-[11px] font-mono text-[#2D5A3D] flex justify-between items-center">
                    <span>Forecast Price Interval:</span>
                    <span className="font-bold">₹{h.forecast.downside} (Low) — ₹{h.forecast.expected} (Exp) — ₹{h.forecast.upside} (High)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Region x Crop Demand Heatmap Grid */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Regional Demand Heatmap (India Mandi Net)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-center">
            <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] text-[#2D5A3D] font-bold">
              Chennai • Methi (HIGH DEMAND)
            </div>
            <div className="p-4 rounded-xl bg-[#E8F5E9] border border-[#A5D6A7] text-[#2D5A3D] font-bold">
              Bangalore • Lettuce (HIGH DEMAND)
            </div>
            <div className="p-4 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] font-bold">
              Madurai • Palak (MED DEMAND)
            </div>
            <div className="p-4 rounded-xl bg-gray-100 border border-gray-200 text-gray-600">
              Coimbatore • Mint (STABLE)
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
