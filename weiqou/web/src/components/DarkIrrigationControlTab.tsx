import React, { useState } from 'react';
import { Droplets, Play, AlertTriangle, ShieldCheck, Clock, Calendar, CheckCircle2, RotateCcw, Sliders, Beaker } from 'lucide-react';

interface DarkIrrigationControlTabProps {
  onActionClick: (actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT') => void;
  eventLogs: Array<{ id: string; time: string; unit: string; action: string; trigger: 'AUTO' | 'MANUAL' | 'SYSTEM'; status: string }>;
}

export const DarkIrrigationControlTab: React.FC<DarkIrrigationControlTabProps> = ({
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
    <div className="relative space-y-8 text-slate-100 font-sans">
      {/* Video Background #4 — Darkened Water Flow Footage */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the (1).mp4"
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
              <Droplets className="w-6 h-6 text-teal-400" />
              <h2 className="font-display text-2xl font-extrabold text-white">Single-Click Irrigation Control Center</h2>
            </div>
            <p className="text-xs text-slate-400 font-light">
              Hydraulics control plane & threshold-triggered moisture pulse logic.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-amber-950/60 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-full font-mono">
              Autonomy Level: L2 SUPERVISED
            </span>
          </div>
        </div>

        {/* Visual Animated SVG Hydraulic Pipeline */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Hydraulic Flow Diagram ([Water Tank] ====&gt; [Pump] ====&gt; [{selectedUnit}] ====&gt; [Return])
            </span>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className={`w-2 h-2 rounded-full ${isPumpActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="font-bold">{isPumpActive ? 'PUMP FLOWING' : 'PUMP IDLE'}</span>
            </div>
          </div>

          <div className="relative overflow-x-auto py-2">
            <svg className="w-full min-w-[700px] h-28" viewBox="0 0 800 100">
              <path d="M 60 50 L 260 50 L 460 50 L 660 50" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" strokeLinecap="round" />
              <path
                d="M 60 50 L 260 50 L 460 50 L 660 50"
                stroke="#2dd4bf"
                strokeWidth="6"
                fill="none"
                className={isPumpActive ? 'animate-water-flow' : ''}
              />
              <g transform="translate(60, 50)">
                <circle r="22" fill="#0369a1" stroke="#38bdf8" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Water Tank</text>
              </g>
              <g transform="translate(260, 50)">
                <circle r="22" fill={isPumpActive ? '#059669' : '#334155'} stroke={isPumpActive ? '#34d399' : '#64748b'} strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">
                  {isPumpActive ? 'Pump RUN' : 'Pump IDLE'}
                </text>
              </g>
              <g transform="translate(460, 50)">
                <circle r="22" fill="#b45309" stroke="#fbbf24" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Unit {selectedUnit}</text>
              </g>
              <g transform="translate(660, 50)">
                <circle r="22" fill="#6b21a8" stroke="#c084fc" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ffffff">Return</text>
              </g>
            </svg>
          </div>
        </div>

        {/* 3 Large Visual Cards Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CENTER: BIG ACTION CARDS (4 Cards) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: IRRIGATE NOW */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-teal-400 font-bold text-sm">
                  <Droplets className="w-5 h-5 text-teal-400" />
                  <span>💧 IRRIGATE NOW</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Moisture-pulse threshold trigger for horizontal unit.</p>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 font-mono text-xs text-teal-300">
                  Pulse: 12 seconds | ~250ml water
                </div>
              </div>
              <button
                onClick={() => onActionClick('IRRIGATE')}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
              >
                IRRIGATE NOW (12s Pulse)
              </button>
            </div>

            {/* Card 2: DOSE NUTRIENT */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                  <Beaker className="w-5 h-5 text-amber-400" />
                  <span>🧪 DOSE NUTRIENT</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Fixed-sequence NPK stock A/B reservoir dosing.</p>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 font-mono text-xs text-amber-300">
                  Target EC: 2.0 mS/cm | Dose 15ml
                </div>
              </div>
              <button
                onClick={() => onActionClick('DOSE')}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
              >
                DOSE NUTRIENT SOLUTION
              </button>
            </div>

            {/* Card 3: ADJUST pH */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  <span>⚗️ ADJUST pH BALANCE</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Dilute acid/base balance setpoint adjustment.</p>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 font-mono text-xs text-emerald-300">
                  Current: 6.2 | Target: 6.0 pH
                </div>
              </div>
              <button
                onClick={() => onActionClick('ADJUST')}
                className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
              >
                ADJUST pH SETPOINT
              </button>
            </div>

            {/* Card 4: FLUSH CYCLE */}
            <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 hover:border-teal-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
                  <RotateCcw className="w-5 h-5 text-purple-400" />
                  <span>🔄 FLUSH & REFILL CYCLE</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Drain line & refill bounded reservoir tower.</p>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5 font-mono text-xs text-purple-300">
                  Full 100L Reservoir Flush
                </div>
              </div>
              <button
                onClick={() => onActionClick('IRRIGATE')}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-full border border-white/10 transition"
              >
                PROPOSE FLUSH CYCLE
              </button>
            </div>
          </div>

          {/* RIGHT: LIVE EVENT LOG (Dark Glass Card) */}
          <div className="lg:col-span-4 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-sm font-bold text-white border-b border-white/10 pb-3">
              Live SCADA Execution Log
            </h3>

            <div className="space-y-2.5 max-h-72 overflow-y-auto font-mono text-xs">
              {eventLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-900/60 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between font-bold text-white">
                    <span>{log.action}</span>
                    <span className="text-emerald-400">{log.status}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Unit: {log.unit}</span>
                    <span>{log.time} ({log.trigger})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* THRESHOLD CONFIGURATION SLIDERS */}
        <div className="bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6 text-xs font-mono">
          <h3 className="font-display text-sm font-bold text-white font-sans">
            Substrate Threshold & Pulse Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-2">
                <span>Moisture Low (Trigger):</span>
                <span className="text-teal-400">{moistureLow}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                value={moistureLow}
                onChange={(e) => setMoistureLow(parseInt(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-bold mb-2">
                <span>Moisture High (Ceiling):</span>
                <span className="text-teal-400">{moistureHigh}%</span>
              </div>
              <input
                type="range"
                min="55"
                max="90"
                value={moistureHigh}
                onChange={(e) => setMoistureHigh(parseInt(e.target.value))}
                className="w-full accent-teal-400"
              />
            </div>

            <div>
              <span className="text-slate-300 font-bold block mb-2 font-sans">Pulse Duration (sec):</span>
              <input
                type="number"
                value={pulseDuration}
                onChange={(e) => setPulseDuration(parseInt(e.target.value) || 12)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-1.5 font-mono text-white text-center"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-6">
              <span className="text-white font-bold font-sans">Auto-Pulse Triggering:</span>
              <button
                onClick={() => setAutoTriggerOn(!autoTriggerOn)}
                className={`w-12 h-6 rounded-full p-1 transition duration-200 ${
                  autoTriggerOn ? 'bg-teal-500' : 'bg-slate-700'
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
      </div>
    </div>
  );
};
