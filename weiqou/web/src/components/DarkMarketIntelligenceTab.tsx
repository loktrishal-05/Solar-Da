import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Minus, MapPin, Award, ChevronRight } from 'lucide-react';

export const DarkMarketIntelligenceTab: React.FC = () => {
  const [selectedCrop, setSelectedCrop] = useState<string>('Methi');

  const tickerItems = [
    { crop: 'Methi', price: 42, trend: 3.2, direction: 'UP' },
    { crop: 'Spinach', price: 38, trend: -1.4, direction: 'DOWN' },
    { crop: 'Coriander', price: 55, trend: 0.0, direction: 'FLAT' },
    { crop: 'Lettuce', price: 120, trend: 8.5, direction: 'UP' },
    { crop: 'Amaranth', price: null, trend: null, direction: 'MISSING' },
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
    {
      crop: 'Methi Fenugreek',
      score: 92,
      priceTrendScore: 95,
      climateFitScore: 90,
      substrateFitScore: 92,
    },
    {
      crop: 'Palak Spinach',
      score: 74,
      priceTrendScore: 60,
      climateFitScore: 85,
      substrateFitScore: 88,
    },
    {
      crop: 'Arai Keerai',
      score: 68,
      priceTrendScore: 50,
      climateFitScore: 80,
      substrateFitScore: 78,
    },
  ];

  return (
    <div className="relative space-y-8 text-slate-100 font-sans">
      {/* Video Background #5 — Darkened Dawn Mandi Market Footage */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter brightness-[0.25] opacity-20"
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/90" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-teal-400" />
              <h2 className="font-display text-2xl font-extrabold text-white">Market Demand Intelligence Desk</h2>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Transparent Mandi price trends (Agmarknet) paired with climate & substrate suitability scoring.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3.5 py-1.5 bg-amber-950/60 text-amber-300 border border-amber-500/30 rounded-full font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Agmarknet • data.gov.in Feed</span>
            </span>
          </div>
        </div>

        {/* 1. HORIZONTAL SCROLLING PRICE TICKER */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-2xl p-3 overflow-hidden font-mono text-xs shadow-2xl">
          <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="font-bold text-teal-400 font-sans uppercase text-[11px] flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" /> LIVE TICKER:
            </span>
            {tickerItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5">
                <span className="font-bold text-white">{item.crop}</span>
                {item.price !== null ? (
                  <>
                    <span className="font-bold text-teal-300">₹{item.price}/kg</span>
                    <span className={`flex items-center text-[10px] font-bold ${item.direction === 'UP' ? 'text-emerald-400' : item.direction === 'DOWN' ? 'text-rose-400' : 'text-slate-400'}`}>
                      {item.direction === 'UP' ? <ArrowUpRight className="w-3 h-3" /> : item.direction === 'DOWN' ? <ArrowDownRight className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      <span>{item.trend > 0 ? `+${item.trend}%` : `${item.trend}%`}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500 font-sans">— (No Data)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 2. DARK PRICE CHART & DEMAND HEATMAP GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Dark Recharts Price Chart */}
          <div className="lg:col-span-7 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white">7-Day Price Trend & Forecast Band</h3>
              <div className="flex space-x-1 text-xs font-mono">
                {['Methi', 'Spinach', 'Coriander'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCrop(c)}
                    className={`px-3 py-1 rounded-full font-bold transition ${selectedCrop === c ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="marketTealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[30, 50]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="price" stroke="#2dd4bf" strokeWidth={3} fill="url(#marketTealGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Dark Demand Heatmap Matrix */}
          <div className="lg:col-span-5 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-sm text-white border-b border-white/10 pb-3">Regional Demand Heatmap Matrix</h3>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-teal-950/60 border border-teal-500/40 p-4 rounded-2xl space-y-1">
                <span className="font-bold text-teal-300 block">Chennai • Methi</span>
                <span className="text-slate-400 text-[11px] block">Demand: 94 / 100</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Avg: ₹42/kg (+12%)</span>
              </div>

              <div className="bg-teal-950/60 border border-teal-500/40 p-4 rounded-2xl space-y-1">
                <span className="font-bold text-teal-300 block">Bangalore • Lettuce</span>
                <span className="text-slate-400 text-[11px] block">Demand: 88 / 100</span>
                <span className="text-[10px] text-emerald-400 font-bold block">Avg: ₹120/kg (+8%)</span>
              </div>

              <div className="bg-amber-950/60 border border-amber-500/40 p-4 rounded-2xl space-y-1">
                <span className="font-bold text-amber-300 block">Madurai • Palak</span>
                <span className="text-slate-400 text-[11px] block">Demand: 65 / 100</span>
                <span className="text-[10px] text-rose-400 font-bold block">Avg: ₹38/kg (-4%)</span>
              </div>

              <div className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl space-y-1">
                <span className="font-bold text-slate-300 block">Coimbatore • Dhania</span>
                <span className="text-slate-400 text-[11px] block">Demand: 52 / 100</span>
                <span className="text-[10px] text-slate-400 font-bold block">Avg: ₹55/kg (Stable)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. CROP RECOMMENDER CARDS WITH MINI PROGRESS BARS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommenderCards.map((card, idx) => (
            <div key={idx} className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-white text-sm">{card.crop}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Rank #{idx + 1} Recommendation</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-3xl font-black text-teal-400">{card.score}</span>
                  <span className="text-[9px] text-slate-400 font-mono block">Score / 100</span>
                </div>
              </div>

              <div className="space-y-2 text-[11px] font-mono">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Price Trend (Weight 0.5):</span>
                    <span className="text-white font-bold">{card.priceTrendScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${card.priceTrendScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Climate Fit (Weight 0.3):</span>
                    <span className="text-white font-bold">{card.climateFitScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${card.climateFitScore}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Substrate Suitability (Weight 0.2):</span>
                    <span className="text-white font-bold">{card.substrateFitScore}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5">
                    <div className="bg-teal-400 h-1.5 rounded-full" style={{ width: `${card.substrateFitScore}%` }} />
                  </div>
                </div>
              </div>

              <button className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition flex items-center justify-center space-x-1">
                <span>Plan Planting Cycle</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-500 font-mono text-center pt-2">
          * Disclaimer: Scores are transparent mathematical heuristics derived from Agmarknet mandi feeds and regional climate parameters. Missing market data stays missing (no interpolation).
        </p>
      </div>
    </div>
  );
};
