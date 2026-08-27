import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ScatterChart, Scatter, LineChart, Line, ZAxis } from 'recharts';
import { Activity, Zap, Droplets, Calendar, Cpu, CheckCircle2, AlertCircle, Camera, RefreshCw, Layers } from 'lucide-react';

interface InteractiveReportsSectionProps {
  onQuickIrrigateAtTime: (timeStr: string) => void;
  onExplainSignal: () => void;
  onLogObservation: () => void;
}

export const InteractiveReportsSection: React.FC<InteractiveReportsSectionProps> = ({
  onQuickIrrigateAtTime,
  onExplainSignal,
  onLogObservation,
}) => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');

  // Moisture trend history
  const moistureData = [
    { time: '00:00', moisture: 42, event: false },
    { time: '04:00', moisture: 36, event: false },
    { time: '08:00', moisture: 31, event: true }, // Irrigated
    { time: '12:00', moisture: 64, event: false },
    { time: '16:00', moisture: 52, event: false },
    { time: '20:00', moisture: 41, event: false },
  ];

  // EC/pH correlation scatter data
  const scatterData = [
    { ph: 6.0, ec: 1.5, time: '08:00' },
    { ph: 6.2, ec: 1.8, time: '10:00' },
    { ph: 6.1, ec: 1.7, time: '12:00' },
    { ph: 6.4, ec: 1.9, time: '14:00' },
    { ph: 6.2, ec: 1.8, time: '16:00' },
  ];

  // Uptake Ratio dual-axis data
  const uptakeData = [
    { time: '08:00', massKg: 100.5, ec: 1.85 },
    { time: '10:00', massKg: 99.8, ec: 1.82 },
    { time: '12:00', massKg: 98.9, ec: 1.75 }, // Active absorption!
    { time: '14:00', massKg: 98.1, ec: 1.70 },
    { time: '16:00', massKg: 97.4, ec: 1.68 },
  ];

  // ESP32 Nodes Map
  const nodes = [
    { id: 'ESP32-A7', unit: 'G-04 (Methi)', lastSeen: '12s ago', signal: 94, battery: 100, status: 'HEALTHY' },
    { id: 'ESP32-B2', unit: 'G-07 (Palak)', lastSeen: '45s ago', signal: 88, battery: 92, status: 'HEALTHY' },
    { id: 'ESP32-R1', unit: 'R-01 (Tower)', lastSeen: '2m ago', signal: 76, battery: 85, status: 'WARNING' },
    { id: 'ESP32-D4', unit: 'Substrate Mix', lastSeen: '5s ago', signal: 98, battery: 100, status: 'HEALTHY' },
  ];

  return (
    <section id="interactive-reports" className="bg-white py-12 px-4 lg:px-6 border-b border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Explorable Visual Analytics</span>
            <h2 className="text-2xl font-extrabold text-[#1A1A1A]">Interactive Dashboard Reports & Sensor Signals</h2>
          </div>

          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-full text-xs font-mono">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  timeRange === range ? 'bg-[#1B4332] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* 2×2 Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* REPORT 1: MOISTURE TREND CHART (Recharts) */}
          <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-blue-600" />
                  <span>Moisture Trend & Irrigation Markers</span>
                </h3>
                <span className="text-[11px] text-gray-500 font-mono">Threshold Lines: Min 35% (Dashed Red) | Max 80% (Dashed Blue)</span>
              </div>
            </div>

            <div className="h-60 w-full bg-white p-2 rounded-xl border border-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={moistureData}
                  onClick={(e) => {
                    if (e && e.activeLabel) onQuickIrrigateAtTime(e.activeLabel.toString());
                  }}
                >
                  <defs>
                    <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4332" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
                  <YAxis stroke="#9CA3AF" fontSize={11} domain={[20, 90]} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="moisture" stroke="#1B4332" strokeWidth={2.5} fill="url(#moistureGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <span className="text-[10px] text-gray-500 font-mono block text-center">
              💡 Click any point on chart to schedule quick irrigation pulse for that time slot.
            </span>
          </div>

          {/* REPORT 2: EC/pH CORRELATION SCATTER */}
          <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>EC / pH Correlation Scatter Plot</span>
                </h3>
                <span className="text-[11px] text-gray-500 font-mono">Shaded Target Window: [5.8, 6.8] pH × [1.2, 2.2] mS/cm</span>
              </div>
            </div>

            <div className="h-60 w-full bg-white p-2 rounded-xl border border-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <XAxis type="number" dataKey="ph" name="pH" domain={[5.0, 7.5]} stroke="#9CA3AF" fontSize={11} />
                  <YAxis type="number" dataKey="ec" name="EC (mS/cm)" domain={[0.8, 2.8]} stroke="#9CA3AF" fontSize={11} />
                  <ZAxis type="number" range={[100, 100]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }} />
                  <Scatter name="Readings" data={scatterData} fill="#059669" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* REPORT 3: NUTRIENT UPTAKE RATIO VISUALIZER (Solar-Da) */}
          <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Solar-Da Nutrient Uptake Ratio Visualizer</span>
                </h3>
                <span className="text-[11px] text-gray-500 font-mono">Correlates Mass Loss (g) vs Salt Clearance (ΔEC)</span>
              </div>

              <button
                onClick={onExplainSignal}
                className="px-3 py-1 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-full shadow-sm transition"
              >
                Explain Signal
              </button>
            </div>

            <div className="h-48 w-full bg-white p-2 rounded-xl border border-gray-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={uptakeData}>
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
                  <YAxis yAxisId="left" stroke="#2563EB" fontSize={11} domain={[95, 102]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#059669" fontSize={11} domain={[1.5, 2.0]} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', fontSize: '12px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="massKg" stroke="#2563EB" strokeWidth={2} name="Mass (kg)" />
                  <Line yAxisId="right" type="monotone" dataKey="ec" stroke="#059669" strokeWidth={2} name="EC (mS/cm)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-mono text-[#059669] flex justify-between items-center">
              <span>Current Quadrant:</span>
              <span className="font-bold">Mass ↓ EC ↓ — NUTRIENT UPTAKE DOMINANT (Healthy Roots)</span>
            </div>
          </div>

          {/* REPORT 4: CROP GROWTH TIMELINE */}
          <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>Methi Fenugreek Growth Timeline (Day 7 / 30)</span>
                </h3>
                <span className="text-[11px] text-gray-500 font-mono">Harvest Target: Day 14 (Baby Leaves)</span>
              </div>

              <button
                onClick={onLogObservation}
                className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-full transition"
              >
                + Log Observation
              </button>
            </div>

            {/* Horizontal Timeline Bar */}
            <div className="space-y-2 font-mono text-xs">
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#1B4332]" style={{ width: '23.3%' }} />
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>Day 0 (Sown)</span>
                <span className="font-bold text-[#1B4332]">Today: Day 7 (Leaves)</span>
                <span>Day 14 (Harvest)</span>
                <span>Day 30 (Mature)</span>
              </div>
            </div>

            {/* Observation Photo Thumbnails */}
            <div className="flex space-x-3 pt-1">
              <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden relative group">
                <img src="/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg" alt="Day 7" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white font-mono text-[9px] text-center">Day 7</span>
              </div>
              <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400 font-mono">
                Day 10
              </div>
            </div>
          </div>
        </div>

        {/* REPORT 5: DEVICE HEALTH MAP */}
        <div className="bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-[#059669]" /> ESP32 Hardware Node Map & Diagnostics
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nodes.map((node) => (
              <div key={node.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-gray-900">{node.id}</span>
                  <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${node.status === 'HEALTHY' ? 'bg-emerald-50 text-[#059669]' : 'bg-amber-50 text-[#D97706]'}`}>
                    {node.status}
                  </span>
                </div>
                <span className="text-gray-500 block">{node.unit}</span>
                <div className="flex justify-between font-mono text-gray-600 text-[11px]">
                  <span>Last Seen: {node.lastSeen}</span>
                  <span>Battery: {node.battery}%</span>
                </div>
                <div className="flex space-x-2 pt-2">
                  <button className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded text-[10px]">
                    REBOOT
                  </button>
                  <button className="flex-1 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded text-[10px]">
                    CALIBRATE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
