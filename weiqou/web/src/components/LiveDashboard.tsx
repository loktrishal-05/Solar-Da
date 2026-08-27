import React from 'react';
import { Droplet, Zap, Activity, Thermometer, Wind, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const LiveDashboard: React.FC = () => {
  const telemetryHistory = [
    { time: '08:00', moisture: 38, ec: 1.50, ph: 6.1, temp: 24.5 },
    { time: '10:00', moisture: 32, ec: 1.52, ph: 6.2, temp: 26.0 },
    { time: '12:00', moisture: 28, ec: 1.55, ph: 6.2, temp: 27.5 },
    { time: '14:00', moisture: 42, ec: 1.54, ph: 6.1, temp: 28.0 },
    { time: '16:00', moisture: 39, ec: 1.53, ph: 6.2, temp: 27.0 },
    { time: '18:00', moisture: 36, ec: 1.55, ph: 6.1, temp: 25.5 },
  ];

  return (
    <section id="live-dashboard" className="py-20 px-4 lg:px-8 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Real-Time Sensor Fabric</span>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A]">Live Telemetry & Diagnostics</h2>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-2 bg-[#E8F5E9] px-3.5 py-1.5 rounded-full border border-[#A5D6A7] text-[#2D5A3D] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span>ESP32 Node Online</span>
            </div>
            <span className="text-gray-500 font-mono">Last Ingest: 2m ago</span>
          </div>
        </div>

        {/* Sensor Honesty Rule Banner */}
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 flex items-start space-x-3 text-xs text-[#8D6E63]">
          <AlertCircle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#5D4037] block">Sensor Honesty Rule (Platform Mandate)</span>
            <span>
              Conductive probes in organic substrates are uncalibrated for individual ionic species. All EC values are presented strictly as <strong>total salt trend proxies</strong>, validated against lab baselines, never as raw NPK claims.
            </span>
          </div>
        </div>

        {/* Telemetry Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Moisture */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Soil Moisture</span>
              <Droplet className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-mono text-2xl font-bold text-[#1A1A1A]">28.5%</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-[#D97706] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              <span>Below Min 35%</span>
            </div>
          </div>

          {/* EC Trend Proxy */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>EC Trend Proxy</span>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-mono text-2xl font-bold text-[#2D5A3D]">1.55</span>
              <span className="text-[10px] text-gray-400 font-mono">mS/cm</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-[#059669] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              <span>Target 1.60</span>
            </div>
          </div>

          {/* pH Level */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Substrate pH</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-mono text-2xl font-bold text-[#1A1A1A]">6.2</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-[#059669] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              <span>Safe [5.8, 6.8]</span>
            </div>
          </div>

          {/* Temperature */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Ambient Temp</span>
              <Thermometer className="w-4 h-4 text-rose-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-mono text-2xl font-bold text-[#1A1A1A]">27.5°C</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-[#059669] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
              <span>DHT22 Probe</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Humidity</span>
              <Wind className="w-4 h-4 text-sky-500" />
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="font-mono text-2xl font-bold text-[#1A1A1A]">62%</span>
            </div>
            <div className="flex items-center space-x-1 text-[11px] text-gray-500 font-semibold font-mono">
              <span>VPD 1.05 kPa</span>
            </div>
          </div>

          {/* Device Health Circular Progress Ring */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center space-y-1">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-[#059669]" strokeDasharray="98, 100" strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-gray-900">98%</span>
            </div>
            <span className="text-[11px] font-bold text-[#059669]">Device Online</span>
          </div>
        </div>

        {/* Forest Green Recharts Sparkline Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-900">Substrate Moisture Trend (Last 12 Hours)</h3>
            <span className="text-xs text-gray-500 font-mono">Setpoint Ceiling: 35.0%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory}>
                <defs>
                  <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5A3D" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2D5A3D" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} domain={[20, 50]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="moisture" stroke="#2D5A3D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorMoisture)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
};
