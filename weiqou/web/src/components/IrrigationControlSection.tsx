import React, { useState } from 'react';
import { Droplets, Play, AlertTriangle, ShieldCheck, Clock, Calendar, CheckCircle2, RotateCcw, Sliders, Beaker } from 'lucide-react';

interface IrrigationControlSectionProps {
  onExecuteQuickAction: (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => void;
  eventLogs: Array<{ id: string; time: string; unit: string; action: string; trigger: 'AUTO' | 'MANUAL' | 'SYSTEM'; status: string }>;
}

export const IrrigationControlSection: React.FC<IrrigationControlSectionProps> = ({
  onExecuteQuickAction,
  eventLogs,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('G-04');
  const [isPumpActive] = useState<boolean>(false);
  const [moistureLow, setMoistureLow] = useState<number>(35);
  const [moistureHigh, setMoistureHigh] = useState<number>(80);
  const [pulseDuration, setPulseDuration] = useState<number>(12);
  const [cooldownMins, setCooldownMins] = useState<number>(30);
  const [autoTriggerOn, setAutoTriggerOn] = useState<boolean>(true);
  const [logFilter, setLogFilter] = useState<'ALL' | 'AUTO' | 'MANUAL' | 'ALERTS'>('ALL');

  const filteredLogs = logFilter === 'ALL'
    ? eventLogs
    : logFilter === 'ALERTS'
    ? eventLogs.filter((l) => l.status.includes('Warning') || l.status.includes('Critical'))
    : eventLogs.filter((l) => l.trigger === logFilter);

  return (
    <section id="irrigation-control" className="bg-[#FAFAF8] py-12 px-4 lg:px-6 border-b border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B4332] text-white flex items-center justify-center font-bold shadow-sm">
              <Droplets className="w-5 h-5 text-[#7CB342]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1A1A1A]">Irrigation & Dosing Control Center</h2>
              <span className="text-xs text-gray-500 font-mono">SCADA Hydraulics Control & Dosing Loop</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Active Grow Unit Selector */}
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-ping" />
              <span className="font-bold text-gray-700">Active Unit:</span>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="bg-transparent font-mono font-bold text-gray-900 focus:outline-none cursor-pointer"
              >
                <option value="G-04">Grow Unit G-04 (Methi Fenugreek)</option>
                <option value="G-07">Grow Unit G-07 (Palak Spinach)</option>
                <option value="R-01">Reservoir Tower R-01 (Lettuce CEA)</option>
              </select>
            </div>

            {/* Autonomy Level Badge */}
            <span className="px-3 py-1 bg-amber-50 text-[#D97706] border border-amber-200 text-xs font-bold rounded-full font-mono">
              L2 SUPERVISED
            </span>
          </div>
        </div>

        {/* Visual Animated SVG Hydraulic Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
              Hydraulic Flow Diagram ([Water Tank] ====&gt; [Pump] ====&gt; [{selectedUnit}] ====&gt; [Return])
            </span>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isPumpActive ? 'bg-[#059669] animate-ping' : 'bg-gray-400'}`} />
              <span className="font-bold">{isPumpActive ? 'PUMP ACTIVE (FLOWING)' : 'PUMP IDLE'}</span>
            </div>
          </div>

          <div className="relative overflow-x-auto py-2">
            <svg className="w-full min-w-[700px] h-28" viewBox="0 0 800 100">
              {/* Base Pipe Line */}
              <path d="M 60 50 L 260 50 L 460 50 L 660 50" stroke="#E5E7EB" strokeWidth="12" fill="none" strokeLinecap="round" />

              {/* Animated Water Flow Line */}
              <path
                d="M 60 50 L 260 50 L 460 50 L 660 50"
                stroke="#0284c7"
                strokeWidth="6"
                fill="none"
                className={isPumpActive ? 'animate-water-flow' : ''}
              />

              {/* Node 1: Water Tank */}
              <g transform="translate(60, 50)">
                <circle r="22" fill="#E0F2FE" stroke="#0284c7" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">Water Tank</text>
              </g>

              {/* Node 2: Main Dosing Pump */}
              <g transform="translate(260, 50)">
                <circle r="22" fill={isPumpActive ? '#E8F5E9' : '#F3F4F6'} stroke={isPumpActive ? '#059669' : '#9CA3AF'} strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={isPumpActive ? '#059669' : '#4B5563'}>
                  {isPumpActive ? 'Pump RUN' : 'Pump IDLE'}
                </text>
              </g>

              {/* Node 3: Grow Unit */}
              <g transform="translate(460, 50)">
                <circle r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#B45309">Unit {selectedUnit}</text>
              </g>

              {/* Node 4: Return Tank */}
              <g transform="translate(660, 50)">
                <circle r="22" fill="#F3E8FF" stroke="#7E22CE" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B21A8">Return</text>
              </g>
            </svg>
          </div>
        </div>

        {/* 3-Column SCADA Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMN 1 — QUICK ACTIONS (One-Click) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Quick Actuation Controls (One-Click)
            </h3>

            <div className="space-y-3">
              {/* Action 1: IRRIGATE NOW */}
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1A1A] text-xs">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span>💧 IRRIGATE NOW</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono block mt-0.5">12-sec pulse | ~250ml water</span>
                </div>
                <button
                  onClick={() => onExecuteQuickAction('IRRIGATE')}
                  className="px-4 py-2 bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs rounded-full shadow-sm transition"
                >
                  EXECUTE
                </button>
              </div>

              {/* Action 2: DOSE NUTRIENT */}
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1A1A] text-xs">
                    <Beaker className="w-4 h-4 text-amber-500" />
                    <span>🧪 DOSE NUTRIENT</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono block mt-0.5">Target EC: 2.0 mS/cm</span>
                </div>
                <button
                  onClick={() => onExecuteQuickAction('DOSE')}
                  className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs rounded-full shadow-sm transition"
                >
                  CALCULATE & EXECUTE
                </button>
              </div>

              {/* Action 3: ADJUST pH */}
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1A1A] text-xs">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>⚗️ ADJUST pH</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono block mt-0.5">Target: 6.0 | Current: 6.2</span>
                </div>
                <button
                  onClick={() => onExecuteQuickAction('ADJUST')}
                  className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs rounded-full shadow-sm transition"
                >
                  CALCULATE & EXECUTE
                </button>
              </div>

              {/* Action 4: FLUSH & REFILL */}
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-1.5 font-bold text-[#1A1A1A] text-xs">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <span>🔄 FLUSH & REFILL</span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono block mt-0.5">Drain line & cycle reservoir</span>
                </div>
                <button
                  onClick={() => onExecuteQuickAction('IRRIGATE')}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-full border border-gray-300 transition"
                >
                  PROPOSE CYCLE
                </button>
              </div>
            </div>
          </div>

          {/* COLUMN 2 — THRESHOLD CONFIGURATION */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2">
              Threshold & Pulse Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-gray-700 font-semibold mb-1">
                  <span>Moisture Low Threshold (Trigger):</span>
                  <span className="font-mono font-bold text-[#1B4332]">{moistureLow}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={moistureLow}
                  onChange={(e) => setMoistureLow(parseInt(e.target.value))}
                  className="w-full accent-[#1B4332]"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-700 font-semibold mb-1">
                  <span>Moisture High Ceiling (Stop):</span>
                  <span className="font-mono font-bold text-[#1B4332]">{moistureHigh}%</span>
                </div>
                <input
                  type="range"
                  min="55"
                  max="90"
                  value={moistureHigh}
                  onChange={(e) => setMoistureHigh(parseInt(e.target.value))}
                  className="w-full accent-[#1B4332]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-600 block mb-1">Pulse Duration (sec):</span>
                  <input
                    type="number"
                    value={pulseDuration}
                    onChange={(e) => setPulseDuration(parseInt(e.target.value) || 12)}
                    className="w-full bg-[#FAFAF8] border border-gray-300 rounded-lg px-2 py-1.5 font-mono font-bold text-gray-900"
                  />
                </div>

                <div>
                  <span className="text-gray-600 block mb-1">Cooldown (mins):</span>
                  <input
                    type="number"
                    value={cooldownMins}
                    onChange={(e) => setCooldownMins(parseInt(e.target.value) || 30)}
                    className="w-full bg-[#FAFAF8] border border-gray-300 rounded-lg px-2 py-1.5 font-mono font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* iOS Style Auto Trigger Toggle */}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-800">Auto-Pulse Triggering:</span>
                <button
                  onClick={() => setAutoTriggerOn(!autoTriggerOn)}
                  className={`w-12 h-6 rounded-full p-1 transition duration-200 ${
                    autoTriggerOn ? 'bg-[#059669]' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white shadow-md transform transition duration-200 ${
                      autoTriggerOn ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full border border-gray-300 transition">
                Save Profile Parameters
              </button>
            </div>
          </div>

          {/* COLUMN 3 — LIVE EVENT LOG */}
          <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Live Execution Log</h3>

              <div className="flex items-center space-x-1 text-[10px]">
                {['ALL', 'AUTO', 'MANUAL', 'ALERTS'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f as any)}
                    className={`px-2 py-0.5 rounded font-bold transition ${
                      logFilter === f ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#FAFAF8] text-gray-500 uppercase border-b border-gray-200">
                  <tr>
                    <th className="py-2 px-2">Time</th>
                    <th className="py-2 px-2">Unit</th>
                    <th className="py-2 px-2">Action</th>
                    <th className="py-2 px-2">Trigger</th>
                    <th className="py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-emerald-50/50 transition">
                      <td className="py-2 px-2 font-bold text-gray-900">{log.time}</td>
                      <td className="py-2 px-2">{log.unit}</td>
                      <td className="py-2 px-2">{log.action}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${log.trigger === 'AUTO' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                          {log.trigger}
                        </span>
                      </td>
                      <td className="py-2 px-2 font-bold text-[#059669]">{log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
