import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, MapPin, ChevronRight } from 'lucide-react';

export const LightMarketSection: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Methi');

  const agmarknetRows = [
    { crop: 'Methi Fenugreek', region: 'Chennai', price: 42, trend: '+3.2%', direction: 'UP' },
    { crop: 'Palak Spinach', region: 'Madurai', price: 38, trend: '-1.4%', direction: 'DOWN' },
    { crop: 'Coriander (Dhania)', region: 'Coimbatore', price: 55, trend: '0.0%', direction: 'FLAT' },
    { crop: 'Iceberg Lettuce', region: 'Bangalore', price: 120, trend: '+8.5%', direction: 'UP' },
    { crop: 'Amaranth (Keerai)', region: 'Salem', price: null, trend: '—', direction: 'MISSING' },
  ];

  const chartData = [
    { day: 'Mon', price: 38 },
    { day: 'Tue', price: 40 },
    { day: 'Wed', price: 39 },
    { day: 'Thu', price: 41 },
    { day: 'Fri', price: 42 },
    { day: 'Sat', price: 44 },
    { day: 'Sun', price: 45 },
  ];

  const recommenderCards = [
    { crop: 'Methi Fenugreek', score: 92, priceScore: 95, climateScore: 90, substrateScore: 92 },
    { crop: 'Palak Spinach', score: 74, priceScore: 60, climateScore: 85, substrateScore: 88 },
    { crop: 'Arai Keerai', score: 68, priceScore: 50, climateScore: 80, substrateScore: 78 },
  ];

  return (
    <section id="market" className="bg-[#FAFAF8] py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-extrabold text-[#1A1A1A]">Market Demand Intelligence Desk</h2>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Agmarknet Mandi price feeds paired with climate & substrate suitability scoring heuristics.
            </p>
          </div>

          <span className="px-3.5 py-1 bg-amber-50 text-[#D97706] border border-amber-200 text-xs font-bold rounded-full font-mono flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Agmarknet Feed Active
          </span>
        </div>

        {/* Split View: Left Agmarknet Table & Right Crop Recommender */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: AGMARKNET PRICE TABLE */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-extrabold text-sm text-[#1A1A1A]">Agmarknet Mandi Price Index (Live)</h3>
              <span className="text-[10px] text-gray-500 font-mono">* Missing data stays missing (no bare guesses)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAFAF8] text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3">Crop</th>
                    <th className="py-2.5 px-3">Region</th>
                    <th className="py-2.5 px-3">Avg Price</th>
                    <th className="py-2.5 px-3">7-Day Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {agmarknetRows.map((r, i) => (
                    <tr key={i} className="hover:bg-emerald-50/50 transition">
                      <td className="py-3 px-3 font-bold text-gray-900 font-sans">{r.crop}</td>
                      <td className="py-3 px-3">{r.region}</td>
                      <td className="py-3 px-3 font-bold text-[#1B4332]">
                        {r.price !== null ? `₹${r.price}/kg` : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`flex items-center font-bold text-[11px] ${r.direction === 'UP' ? 'text-[#059669]' : r.direction === 'DOWN' ? 'text-red-600' : 'text-gray-500'}`}>
                          {r.direction === 'UP' && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {r.direction === 'DOWN' && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {r.direction === 'FLAT' && <Minus className="w-3.5 h-3.5" />}
                          <span>{r.trend}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Chart */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-gray-900 font-sans">Methi Fenugreek Price Trend (7-Day)</h4>
                <span className="text-[10px] font-mono text-gray-500">Agmarknet Chennai Feed</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="marketGreenGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1B4332" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#6B7280" fontSize={11} />
                    <YAxis stroke="#6B7280" fontSize={11} domain={[30, 50]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="price" stroke="#1B4332" strokeWidth={2.5} fill="url(#marketGreenGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT: CROP RECOMMENDER HEURISTIC SCORE CARDS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-[#1A1A1A]">Transparent Heuristic Crop Recommender</h3>
              <p className="text-xs text-gray-500">
                Score = Price Trend × 0.5 + Climate Fit × 0.3 + Substrate Fit × 0.2
              </p>
            </div>

            {recommenderCards.map((card, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">{card.crop}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">Rank #{idx + 1} Recommendation</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-3xl font-black text-[#1B4332]">{card.score}</span>
                    <span className="text-[9px] text-gray-500 font-mono block">Score / 100</span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px] font-mono">
                  <div>
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>Price Trend (Weight 0.5):</span>
                      <span className="text-gray-900 font-bold">{card.priceScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#1B4332] h-1.5 rounded-full" style={{ width: `${card.priceScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>Climate Fit (Weight 0.3):</span>
                      <span className="text-gray-900 font-bold">{card.climateScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#1B4332] h-1.5 rounded-full" style={{ width: `${card.climateScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>Substrate Suitability (Weight 0.2):</span>
                      <span className="text-gray-900 font-bold">{card.substrateScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#1B4332] h-1.5 rounded-full" style={{ width: `${card.substrateScore}%` }} />
                    </div>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs rounded-full shadow-sm transition flex items-center justify-center space-x-1">
                  <span>Plan Planting Cycle</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
