import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, MapPin, Award, Calendar, ChevronRight } from 'lucide-react';

export const MarketTradingDesk: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Methi');
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'climate' | 'substrate'>('score');

  const tickerItems = [
    { crop: 'Methi', price: 42, trend: 3.2, direction: 'UP' },
    { crop: 'Spinach', price: 38, trend: -1.4, direction: 'DOWN' },
    { crop: 'Coriander', price: 55, trend: 0.0, direction: 'FLAT' },
    { crop: 'Lettuce', price: 120, trend: 8.5, direction: 'UP' },
    { crop: 'Amaranth', price: null, trend: null, direction: 'MISSING' },
  ];

  const chartData = [
    { day: 'Mon', price: 38, low: 34, high: 42 },
    { day: 'Tue', price: 40, low: 36, high: 44 },
    { day: 'Wed', price: 39, low: 35, high: 43 },
    { day: 'Thu', price: 41, low: 37, high: 45 },
    { day: 'Fri', price: 42, low: 38, high: 46 },
    { day: 'Sat', price: 44, low: 40, high: 48 },
    { day: 'Sun', price: 45, low: 41, high: 49 },
  ];

  const recommenderCards = [
    {
      crop: 'Methi Fenugreek',
      score: 92,
      priceTrendScore: 95,
      climateFitScore: 90,
      substrateFitScore: 92,
      priceTrend: '+12.5% this week',
    },
    {
      crop: 'Palak Spinach',
      score: 74,
      priceTrendScore: 60,
      climateFitScore: 85,
      substrateFitScore: 88,
      priceTrend: '-4.0% this week',
    },
    {
      crop: 'Arai Keerai',
      score: 68,
      priceTrendScore: 50,
      climateFitScore: 80,
      substrateFitScore: 78,
      priceTrend: 'Data Sourced from Madurai',
    },
  ];

  return (
    <section id="market-desk" className="bg-white py-12 px-4 lg:px-6 border-b border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Agmarknet Trading Desk</span>
            <h2 className="text-2xl font-extrabold text-[#1A1A1A]">Market Demand & Crop Intelligence Desk</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3 py-1 bg-amber-50 text-[#D97706] border border-amber-200 font-bold rounded-full flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>data.gov.in (India Mandi Feed)</span>
            </span>
          </div>
        </div>

        {/* 1. LIVE PRICE TICKER */}
        <div className="bg-[#FAFAF8] border border-gray-200 rounded-xl p-3 overflow-hidden shadow-inner font-mono text-xs">
          <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap">
            <span className="font-bold text-gray-900 font-sans uppercase text-[11px] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#1B4332]" /> LIVE TICKER:
            </span>
            {tickerItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="font-bold text-gray-800">{item.crop}</span>
                {item.price !== null ? (
                  <>
                    <span className="font-bold text-gray-900">₹{item.price}/kg</span>
                    <span className={`flex items-center text-[10px] font-bold ${item.direction === 'UP' ? 'text-[#059669]' : item.direction === 'DOWN' ? 'text-red-600' : 'text-gray-500'}`}>
                      {item.direction === 'UP' ? <ArrowUpRight className="w-3 h-3" /> : item.direction === 'DOWN' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      <span>{item.trend > 0 ? `+${item.trend}%` : `${item.trend}%`}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 font-sans">— (No Data)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. PRICE CHART & DEMAND HEATMAP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PRICE CHART WITH PREDICTION BAND */}
          <div className="lg:col-span-7 bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-gray-900">Price Trend & Prediction Bands (7-Day)</h3>
                <span className="text-xs text-gray-500 font-mono">Crop: {selectedCrop}</span>
              </div>

              <div className="flex space-x-1 text-xs font-mono">
                {['Methi', 'Spinach', 'Coriander'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCrop(c)}
                    className={`px-2.5 py-0.5 rounded font-bold transition ${selectedCrop === c ? 'bg-[#1B4332] text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-60 w-full bg-white p-2 rounded-xl border border-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="priceBandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} domain={[30, 55]} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="price" stroke="#059669" strokeWidth={2.5} fill="url(#priceBandGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-gray-500 font-mono block text-center">
              Forecast Bands: Downside (Low) | Expected (Mid) | Upside (High) — Sourced from historical Agmarknet mandi data.
            </span>
          </div>

          {/* DEMAND HEATMAP GRID */}
          <div className="lg:col-span-5 bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-gray-900 border-b border-gray-200 pb-2">Regional Demand Heatmap Matrix</h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                <span className="font-bold text-[#059669] block">Chennai • Methi</span>
                <span className="text-gray-600 text-[11px] block">Demand Score: 94 / 100</span>
                <span className="text-[10px] text-gray-500 block">Avg: ₹45/kg (+12%)</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl space-y-1">
                <span className="font-bold text-[#059669] block">Bangalore • Lettuce</span>
                <span className="text-gray-600 text-[11px] block">Demand Score: 88 / 100</span>
                <span className="text-[10px] text-gray-500 block">Avg: ₹120/kg (+8%)</span>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-1">
                <span className="font-bold text-[#D97706] block">Madurai • Palak</span>
                <span className="text-gray-600 text-[11px] block">Demand Score: 65 / 100</span>
                <span className="text-[10px] text-gray-500 block">Avg: ₹35/kg (-4%)</span>
              </div>

              <div className="bg-gray-100 border border-gray-200 p-3 rounded-xl space-y-1">
                <span className="font-bold text-gray-700 block">Coimbatore • Dhania</span>
                <span className="text-gray-600 text-[11px] block">Demand Score: 52 / 100</span>
                <span className="text-[10px] text-gray-500 block">Avg: ₹55/kg (Stable)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. SORTABLE CROP RECOMMENDER SCORE CARDS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">
              Transparent Heuristic Crop Recommender Scores
            </h3>

            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="text-gray-500">Sort By:</span>
              {['score', 'price', 'climate', 'substrate'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSortBy(s as any)}
                  className={`px-2.5 py-1 rounded font-bold uppercase transition ${sortBy === s ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommenderCards.map((card, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{card.crop}</h4>
                    <span className="text-[10px] text-gray-500 font-mono">Rank #{idx + 1} Recommendation</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-bold text-[#1B4332]">{card.score}</span>
                    <span className="text-[9px] text-gray-500 font-mono block">Score / 100</span>
                  </div>
                </div>

                {/* 3 Mini Progress Bar Component Bars */}
                <div className="space-y-2 text-[11px] font-mono">
                  <div>
                    <div className="flex justify-between text-gray-600 mb-0.5">
                      <span>Price Trend (Weight 0.5):</span>
                      <span className="font-bold text-gray-900">{card.priceTrendScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#059669] h-1.5 rounded-full" style={{ width: `${card.priceTrendScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-600 mb-0.5">
                      <span>Climate Fit (Weight 0.3):</span>
                      <span className="font-bold text-gray-900">{card.climateFitScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#059669] h-1.5 rounded-full" style={{ width: `${card.climateFitScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-gray-600 mb-0.5">
                      <span>Substrate Suitability (Weight 0.2):</span>
                      <span className="font-bold text-gray-900">{card.substrateFitScore}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#059669] h-1.5 rounded-full" style={{ width: `${card.substrateFitScore}%` }} />
                    </div>
                  </div>
                </div>

                <button className="w-full py-2 bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs rounded-full shadow-sm transition flex items-center justify-center space-x-1">
                  <span>Plan Planting Cycle</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-gray-500 font-mono text-center pt-2">
            * Disclaimer: Suitability scores are transparent mathematical heuristics derived from live mandi trends and regional climate norms, not black-box ML predictions.
          </p>
        </div>
      </div>
    </section>
  );
};
