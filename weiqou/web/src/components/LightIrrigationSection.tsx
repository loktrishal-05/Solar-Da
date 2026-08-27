import React, { useState } from 'react';
import { Droplets, Play, AlertTriangle, ShieldCheck, Clock, Calendar, CheckCircle2, RotateCcw, Sliders, Beaker } from 'lucide-react';

interface LightIrrigationSectionProps {
  onActionClick: (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => void;
  eventLogs: Array<{ id: string; time: string; unit: string; action: string; trigger: 'AUTO' | 'MANUAL' | 'SYSTEM'; status: string }>;
}

export const LightIrrigationSection: React.FC<LightIrrigationSectionProps> = ({
  onActionClick,
  eventLogs,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('G-04');
  const [isPumpActive] = useState<boolean>(false);
  const [moistureLow, setMoistureLow] = useState<number>(35);
  const [moistureHigh, setMoistureHigh] = useState<number>(80);
  const [pulseDuration, setPulseDuration] = useState<number>(12);
  const [cooldownMins, setCooldownMins] = useState<number>(30);
  const [autoTriggerOn, setAutoTriggerOn] = useState<boolean>(true);

  return (
    <section id="irrigation" className="relative bg-[#FAFAF8] py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans overflow-hidden">
      {/* Video Background #5 — Subtle Water Flow Video with 90% White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the (1).mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter saturate-[0.8] opacity-15"
        />
        <div className="absolute inset-0 bg-[#FAFAF8]/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Droplets className="w-6 h-6 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-extrabold text-[#1A1A1A]">Irrigation Automation Control Center</h2>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Hydraulics control plane & threshold-triggered moisture pulse logic.
            </p>
          </div>

          <span className="px-3.5 py-1 bg-amber-50 text-[#D97706] border border-amber-200 text-xs font-bold rounded-full font-mono">
            Autonomy Level: L2 SUPERVISED
          </span>
        </div>

        {/* Visual Animated SVG Pipeline */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
              Hydraulic Pipeline Diagram ([Water Tank] ====&gt; [Pump] ====&gt; [{selectedUnit}] ====&gt; [Return])
            </span>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isPumpActive ? 'bg-[#059669] animate-ping' : 'bg-gray-400'}`} />
              <span className="font-bold">{isPumpActive ? 'PUMP FLOWING' : 'PUMP IDLE'}</span>
            </div>
          </div>

          <div className="relative overflow-x-auto py-2">
            <svg className="w-full min-w-[700px] h-28" viewBox="0 0 800 100">
              <path d="M 60 50 L 260 50 L 460 50 L 660 50" stroke="#E5E7EB" strokeWidth="12" fill="none" strokeLinecap="round" />
              <path
                d="M 60 50 L 260 50 L 460 50 L 660 50"
                stroke="#0284c7"
                strokeWidth="6"
                fill="none"
                className={isPumpActive ? 'animate-water-flow' : ''}
              />
              <g transform="translate(60, 50)">
                <circle r="22" fill="#E0F2FE" stroke="#0284c7" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">Water Tank</text>
              </g>
              <g transform="translate(260, 50)">
                <circle r="22" fill={isPumpActive ? '#E8F5E9' : '#F3F4F6'} stroke={isPumpActive ? '#059669' : '#9CA3AF'} strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={isPumpActive ? '#059669' : '#4B5563'}>
                  {isPumpActive ? 'Pump RUN' : 'Pump IDLE'}
                </text>
              </g>
              <g transform="translate(460, 50)">
                <circle r="22" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#B45309">Unit {selectedUnit}</text>
              </g>
              <g transform="translate(660, 50)">
                <circle r="22" fill="#F3E8FF" stroke="#7E22CE" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#6B21A8">Return</text>
              </g>
            </svg>
          </div>
        </div>

        {/* 4 Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: IRRIGATE NOW */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[#1B4332] font-bold text-sm">
                <Droplets className="w-5 h-5 text-blue-600" />
                <span>💧 IRRIGATE NOW</span>
              </div>
              <p className="text-xs text-gray-500 font-normal">Moisture-pulse threshold trigger for unit.</p>
              <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-gray-100 font-mono text-xs text-gray-800">
                Pulse: 12 seconds | ~250ml water
              </div>
            </div>
            <button
              onClick={() => onActionClick('IRRIGATE')}
              className="w-full py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              IRRIGATE NOW (12s Pulse)
            </button>
          </div>

          {/* Card 2: DOSE NUTRIENT */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[#D97706] font-bold text-sm">
                <Beaker className="w-5 h-5 text-amber-500" />
                <span>🧪 DOSE NUTRIENT</span>
              </div>
              <p className="text-xs text-gray-500 font-normal">Fixed-sequence NPK stock A/B reservoir dosing.</p>
              <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-gray-100 font-mono text-xs text-gray-800">
                Target EC: 2.0 mS/cm | Dose 15ml
              </div>
            </div>
            <button
              onClick={() => onActionClick('DOSE')}
              className="w-full py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              DOSE NUTRIENT SOLUTION
            </button>
          </div>

          {/* Card 3: ADJUST pH */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-[#059669] font-bold text-sm">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>⚗️ ADJUST pH</span>
              </div>
              <p className="text-xs text-gray-500 font-normal">Dilute acid/base balance setpoint adjustment.</p>
              <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-gray-100 font-mono text-xs text-gray-800">
                Current: 6.2 | Target: 6.0 pH
              </div>
            </div>
            <button
              onClick={() => onActionClick('ADJUST')}
              className="w-full py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
            >
              ADJUST pH SETPOINT
            </button>
          </div>

          {/* Card 4: FLUSH CYCLE */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 flex flex-col justify-between hover:shadow-md transition">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <span>🔄 FLUSH & REFILL</span>
              </div>
              <p className="text-xs text-gray-500 font-normal">Drain line & refill bounded reservoir tower.</p>
              <div className="p-2.5 bg-[#FAFAF8] rounded-xl border border-gray-100 font-mono text-xs text-gray-800">
                Full 100L Reservoir Flush
              </div>
            </div>
            <button
              onClick={() => onActionClick('IRRIGATE')}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-full border border-gray-300 transition"
            >
              PROPOSE FLUSH CYCLE
            </button>
          </div>
        </div>

        {/* Dual Column: Controls Sliders & Event Log Table */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Sliders */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 text-xs font-mono">
            <h3 className="font-extrabold text-sm text-[#1A1A1A] font-sans border-b border-gray-100 pb-2">
              Threshold & Pulse Parameters
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-gray-700 font-bold mb-1">
                  <span>Moisture Low (Trigger):</span>
                  <span className="text-[#1B4332]">{moistureLow}%</span>
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
                <div className="flex justify-between text-gray-700 font-bold mb-1">
                  <span>Moisture High (Ceiling):</span>
                  <span className="text-[#1B4332]">{moistureHigh}%</span>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-700 font-bold block mb-1 font-sans">Pulse Duration (sec):</span>
                  <input
                    type="number"
                    value={pulseDuration}
                    onChange={(e) => setPulseDuration(parseInt(e.target.value) || 12)}
                    className="w-full bg-[#FAFAF8] border border-gray-300 rounded-xl px-3 py-1.5 font-mono text-gray-900 font-bold"
                  />
                </div>

                <div>
                  <span className="text-gray-700 font-bold block mb-1 font-sans">Cooldown (mins):</span>
                  <input
                    type="number"
                    value={cooldownMins}
                    onChange={(e) => setCooldownMins(parseInt(e.target.value) || 30)}
                    className="w-full bg-[#FAFAF8] border border-gray-300 rounded-xl px-3 py-1.5 font-mono text-gray-900 font-bold"
                  />
                </div>
              </div>

              {/* iOS Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-900 font-bold font-sans">Auto-Pulse Triggering:</span>
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
            </div>
          </div>

          {/* Live Execution Event Log Table */}
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <h3 className="font-extrabold text-sm text-[#1A1A1A] font-sans border-b border-gray-100 pb-2">
              Live SCADA Execution Log Table
            </h3>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
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
                  {eventLogs.map((log) => (
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
