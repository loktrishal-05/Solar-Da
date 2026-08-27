import React from 'react';
import { Droplets, Zap, Activity, Thermometer, Wind, Cpu, ArrowUp, ArrowDown, ArrowRight, AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface CommandHeroDashboardProps {
  onActionClick: (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => void;
  onDismissAlert: (alertId: string) => void;
  onViewAlert: (alertId: string) => void;
  alerts: Array<{ id: string; type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; timestamp: string }>;
}

export const CommandHeroDashboard: React.FC<CommandHeroDashboardProps> = ({
  onActionClick,
  onDismissAlert,
  onViewAlert,
  alerts,
}) => {
  return (
    <section id="hero-command" className="bg-white border-b border-gray-200 shadow-sm p-4 lg:p-6 font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 60% — LIVE TELEMETRY GRID (3×2 Cards) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              Live Grow Unit Telemetry (SCADA Feeds)
            </span>
            <span className="text-[11px] font-mono text-gray-500">Active Node: G-04 (Methi)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Soil Moisture */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                  <span>MOISTURE</span>
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-gray-900">62%</span>
                  <span className="text-xs font-mono text-[#059669] font-bold flex items-center">
                    <ArrowUp className="w-3 h-3" /> 3%
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">Unit G-04</span>
              </div>
              <button
                onClick={() => onActionClick('IRRIGATE')}
                className="w-full h-9 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>IRRIGATE</span>
              </button>
            </div>

            {/* Card 2: EC Trend Proxy */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                  <span>EC PROXY</span>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-[#1B4332]">1.8</span>
                  <span className="text-xs font-mono text-amber-600 font-bold flex items-center">
                    <ArrowDown className="w-3 h-3" /> 0.2
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">mS/cm (G-04)</span>
              </div>
              <button
                onClick={() => onActionClick('DOSE')}
                className="w-full h-9 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>DOSE</span>
              </button>
            </div>

            {/* Card 3: pH Level */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                  <span>pH LEVEL</span>
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-gray-900">6.2</span>
                  <span className="text-xs font-mono text-gray-500 font-bold flex items-center">
                    <ArrowRight className="w-3 h-3" /> 0.0
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">Unit G-04</span>
              </div>
              <button
                onClick={() => onActionClick('ADJUST')}
                className="w-full h-9 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>ADJUST</span>
              </button>
            </div>

            {/* Card 4: Ambient Temperature */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                  <span>TEMP</span>
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-gray-900">28.4°C</span>
                  <span className="text-xs font-mono text-gray-500 font-bold flex items-center">
                    <ArrowRight className="w-3-h-3" /> 0.0
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">Unit G-04</span>
              </div>
              <button
                onClick={() => onActionClick('FAN')}
                className="w-full h-9 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>FAN</span>
              </button>
            </div>

            {/* Card 5: Humidity */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                  <span>HUMIDITY</span>
                  <Wind className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-2xl font-bold text-gray-900">71%</span>
                  <span className="text-xs font-mono text-[#059669] font-bold flex items-center">
                    <ArrowUp className="w-3 h-3" /> 5%
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">Unit G-04</span>
              </div>
              <button
                onClick={() => onActionClick('MIST')}
                className="w-full h-9 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>MIST</span>
              </button>
            </div>

            {/* Card 6: Device Health */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
                  <span>DEVICE</span>
                  <Cpu className="w-3.5 h-3.5 text-[#059669]" />
                </div>
                <div className="flex items-baseline space-x-1 mt-1">
                  <span className="font-mono text-lg font-bold text-[#059669]">● Online</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono block">ESP32-A7 Node</span>
              </div>
              <button
                onClick={() => onActionClick('REBOOT')}
                className="w-full h-9 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1"
              >
                <span>REBOOT</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 40% — SYSTEM HEALTH & ACTIVE ALERTS */}
        <div className="lg:col-span-5 bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex items-center space-x-3">
              {/* Circular SVG Donut Gauge "System Health 94%" */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-[#059669]" strokeDasharray="94, 100" strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute font-mono font-bold text-[11px] text-gray-900">94%</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">System SCADA Health</h3>
                <span className="text-[10px] text-gray-500 font-mono block">All Safety Checks Passing</span>
              </div>
            </div>

            <a href="#sms-alerts" className="text-xs font-bold text-[#1B4332] hover:underline">
              View All Alerts ({alerts.length})
            </a>
          </div>

          {/* Active Alerts List (Max 3 Visible) */}
          <div className="space-y-2 flex-1">
            {alerts.slice(0, 3).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border flex items-start justify-between gap-2 text-xs font-mono ${
                  alert.type === 'CRITICAL'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : alert.type === 'WARNING'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="font-bold flex items-center gap-1.5 font-sans">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        alert.type === 'CRITICAL' ? 'bg-red-600 animate-ping' : alert.type === 'WARNING' ? 'bg-amber-600' : 'bg-blue-600'
                      }`}
                    />
                    <span>{alert.type}: {alert.message}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 block">{alert.timestamp}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onViewAlert(alert.id)}
                    className="px-2 py-0.5 bg-white border border-gray-300 rounded font-bold text-[10px] text-gray-700 hover:bg-gray-100"
                  >
                    VIEW
                  </button>
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
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
