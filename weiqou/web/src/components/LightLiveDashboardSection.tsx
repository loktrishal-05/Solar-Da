import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Droplets, Zap, Activity, Thermometer, Wind, Cpu, ArrowDown, AlertCircle } from 'lucide-react';

interface LightLiveDashboardSectionProps {
  onActionClick: (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => void;
}

export const LightLiveDashboardSection: React.FC<LightLiveDashboardSectionProps> = ({ onActionClick }) => {
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D' | '30D'>('24H');

  const historyData = [
    { time: '00:00', moisture: 42, ec: 1.50 },
    { time: '04:00', moisture: 36, ec: 1.52 },
    { time: '08:00', moisture: 28, ec: 1.55 },
    { time: '12:00', moisture: 64, ec: 1.54 },
    { time: '16:00', moisture: 52, ec: 1.53 },
    { time: '20:00', moisture: 41, ec: 1.55 },
  ];

  return (
    <section id="live-dashboard" className="bg-white py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-ping" />
              <h2 className="font-display text-2xl font-extrabold text-[#1A1A1A]">Live Plant Telemetry & Sensor Signals</h2>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Real-time substrate & bounded reservoir telemetry with lab-validated trend proxies.
            </p>
          </div>

          <div className="flex items-center space-x-1 bg-[#FAFAF8] p-1 rounded-full border border-gray-200 text-xs font-mono">
            {['1H', '24H', '7D', '30D'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r as any)}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  timeRange === r ? 'bg-[#1B4332] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Sensor Honesty Rule Banner */}
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-2xl p-4 flex items-start space-x-3 text-xs text-[#8D6E63]">
          <AlertCircle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-gray-900 block">Sensor Honesty Rule (Platform Mandate)</span>
            <span>
              Conductive NPK probes in organic substrates are uncalibrated for individual ions. All EC values are presented strictly as <strong>total salt trend proxies</strong>, validated against lab baselines, never as precise raw NPK claims.
            </span>
          </div>
        </div>

        {/* 6 White Cards Grid with Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Soil Moisture */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
              <span className="uppercase">Soil Moisture</span>
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-4xl font-black text-gray-900">28.5%</span>
              <span className="text-xs font-mono text-[#D97706] font-bold flex items-center">
                <ArrowDown className="w-3.5 h-3.5" /> Below 35%
              </span>
            </div>
            <div className="h-10 w-full bg-[#FAFAF8] rounded-xl p-1 border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <Area type="monotone" dataKey="moisture" stroke="#1B4332" fill="#1B4332" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => onActionClick('IRRIGATE')}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              IRRIGATE
            </button>
          </div>

          {/* Card 2: EC Trend Proxy */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
              <span className="uppercase">EC Salt Proxy</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-4xl font-black text-[#059669]">1.55</span>
              <span className="text-xs font-mono text-gray-500">mS/cm</span>
            </div>
            <div className="h-10 w-full bg-[#FAFAF8] rounded-xl p-1 border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <Area type="monotone" dataKey="ec" stroke="#059669" fill="#059669" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => onActionClick('DOSE')}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              DOSE
            </button>
          </div>

          {/* Card 3: pH Level */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
              <span className="uppercase">Substrate pH</span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-4xl font-black text-gray-900">6.2</span>
              <span className="text-xs font-mono text-[#059669] font-bold">Target [5.8, 6.8]</span>
            </div>
            <div className="h-10 w-full bg-[#FAFAF8] rounded-xl p-1 border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <Area type="monotone" dataKey="moisture" stroke="#1B4332" fill="#1B4332" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => onActionClick('ADJUST')}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              ADJUST
            </button>
          </div>

          {/* Card 4: Ambient Temp */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
              <span className="uppercase">Ambient Temp</span>
              <Thermometer className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-4xl font-black text-rose-600">27.5°C</span>
              <span className="text-xs font-mono text-gray-500">DHT22 Probe</span>
            </div>
            <div className="h-10 w-full bg-[#FAFAF8] rounded-xl p-1 border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <Area type="monotone" dataKey="moisture" stroke="#e11d48" fill="#e11d48" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => onActionClick('FAN')}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              FAN
            </button>
          </div>

          {/* Card 5: Humidity */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
              <span className="uppercase">Humidity</span>
              <Wind className="w-4 h-4 text-sky-500" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-4xl font-black text-sky-600">62%</span>
              <span className="text-xs font-mono text-gray-500">VPD 1.05 kPa</span>
            </div>
            <div className="h-10 w-full bg-[#FAFAF8] rounded-xl p-1 border border-gray-100">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData}>
                  <Area type="monotone" dataKey="moisture" stroke="#0284c7" fill="#0284c7" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <button
              onClick={() => onActionClick('MIST')}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              MIST
            </button>
          </div>

          {/* Card 6: Device Health */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 hover:shadow-md transition">
            <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
              <span className="uppercase">Node Health</span>
              <Cpu className="w-4 h-4 text-[#059669]" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-3xl font-black text-[#059669]">● Online</span>
              <span className="text-xs font-mono text-gray-500">ESP32-A7</span>
            </div>
            <div className="h-10 w-full bg-[#FAFAF8] rounded-xl p-2 flex items-center justify-between text-xs font-mono text-gray-600 border border-gray-100">
              <span>Uptime: 14d 06h</span>
              <span>Battery: 100%</span>
            </div>
            <button
              onClick={() => onActionClick('REBOOT')}
              className="w-full py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              REBOOT
            </button>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-extrabold text-base text-[#1A1A1A]">24-Hour Substrate Moisture Trend Chart</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="lightMoistureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B4332" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1B4332" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} domain={[20, 80]} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="moisture" stroke="#1B4332" strokeWidth={2.5} fill="url(#lightMoistureGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
