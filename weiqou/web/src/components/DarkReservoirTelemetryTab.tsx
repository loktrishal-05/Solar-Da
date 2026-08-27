import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Droplets, Zap, Activity, Thermometer, Wind, Cpu, ArrowUp, ArrowDown, ArrowRight, AlertCircle } from 'lucide-react';

interface DarkReservoirTelemetryTabProps {
  onActionClick: (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => void;
}

export const DarkReservoirTelemetryTab: React.FC<DarkReservoirTelemetryTabProps> = ({ onActionClick }) => {
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D' | '30D'>('24H');

  const historyData = [
    { time: '00:00', moisture: 42, ec: 1.50 },
    { time: '04:00', moisture: 36, ec: 1.52 },
    { time: '08:00', moisture: 28, ec: 1.55 }, // Pulse triggered
    { time: '12:00', moisture: 64, ec: 1.54 },
    { time: '16:00', moisture: 52, ec: 1.53 },
    { time: '20:00', moisture: 41, ec: 1.55 },
  ];

  return (
    <div className="space-y-8 text-slate-100 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h2 className="font-display text-2xl font-extrabold text-white">Reservoir & Tower Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400 font-light">
            Real-time substrate & bounded reservoir telemetry with lab-validated trend proxies.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-full border border-white/10 text-xs font-mono">
            {['1H', '24H', '7D', '30D'].map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r as any)}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  timeRange === r ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sensor Honesty Rule Banner */}
      <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-4 flex items-start space-x-3 text-xs text-amber-200">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-100 block">Sensor Honesty Rule (Platform Mandate)</span>
          <span>
            Conductive NPK probes in organic substrates are uncalibrated for individual ions. All EC values are presented strictly as <strong>total salt trend proxies</strong>, validated against lab baselines, never as precise raw NPK claims.
          </span>
        </div>
      </div>

      {/* 6-Card Dark Glassmorphism Grid with Sparkline & Action Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Soil Moisture */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Soil Moisture</span>
            <Droplets className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-black text-white">28.5%</span>
            <span className="text-xs font-mono text-amber-400 font-bold flex items-center">
              <ArrowDown className="w-3.5 h-3.5" /> Below 35%
            </span>
          </div>
          <div className="h-10 w-full bg-slate-950/60 rounded-xl p-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <Area type="monotone" dataKey="moisture" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            onClick={() => onActionClick('IRRIGATE')}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
          >
            IRRIGATE
          </button>
        </div>

        {/* Card 2: EC Trend Proxy */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">EC Trend Proxy</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-black text-emerald-400">1.55</span>
            <span className="text-xs font-mono text-slate-400">mS/cm</span>
          </div>
          <div className="h-10 w-full bg-slate-950/60 rounded-xl p-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <Area type="monotone" dataKey="ec" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            onClick={() => onActionClick('DOSE')}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
          >
            DOSE
          </button>
        </div>

        {/* Card 3: pH Level */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Substrate pH</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-black text-white">6.2</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">Window [5.8, 6.8]</span>
          </div>
          <div className="h-10 w-full bg-slate-950/60 rounded-xl p-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <Area type="monotone" dataKey="moisture" stroke="#2dd4bf" fill="#2dd4bf" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            onClick={() => onActionClick('ADJUST')}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
          >
            ADJUST
          </button>
        </div>

        {/* Card 4: Ambient Temp */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Ambient Temp</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-black text-rose-300">27.5°C</span>
            <span className="text-xs font-mono text-slate-400">DHT22 Probe</span>
          </div>
          <div className="h-10 w-full bg-slate-950/60 rounded-xl p-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <Area type="monotone" dataKey="moisture" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            onClick={() => onActionClick('FAN')}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
          >
            FAN
          </button>
        </div>

        {/* Card 5: Humidity */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Humidity</span>
            <Wind className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-4xl font-black text-sky-300">62%</span>
            <span className="text-xs font-mono text-slate-400">VPD 1.05 kPa</span>
          </div>
          <div className="h-10 w-full bg-slate-950/60 rounded-xl p-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <Area type="monotone" dataKey="moisture" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <button
            onClick={() => onActionClick('MIST')}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
          >
            MIST
          </button>
        </div>

        {/* Card 6: Device Status */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono uppercase">Node Health</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-3xl font-black text-emerald-400">● Online</span>
            <span className="text-xs font-mono text-slate-400">ESP32-A7</span>
          </div>
          <div className="h-10 w-full bg-slate-950/60 rounded-xl p-2 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Uptime: 14d 06h</span>
            <span>Signal: -64 dBm</span>
          </div>
          <button
            onClick={() => onActionClick('REBOOT')}
            className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
          >
            REBOOT
          </button>
        </div>
      </div>

      {/* Main Large Recharts Area Chart */}
      <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-display text-base font-bold text-white">Substrate Moisture Telemetry (24-Hour Trend)</h3>
          <span className="text-xs text-slate-400 font-mono">Setpoint Threshold: 35.0%</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="mainMoistureGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[20, 80]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }} />
              <Area type="monotone" dataKey="moisture" stroke="#2dd4bf" strokeWidth={3} fill="url(#mainMoistureGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
