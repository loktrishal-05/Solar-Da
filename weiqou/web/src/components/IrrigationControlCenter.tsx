import React, { useState } from 'react';
import { Droplet, Play, AlertTriangle, ShieldCheck, Clock, Calendar, CheckCircle2, X } from 'lucide-react';

export const IrrigationControlCenter: React.FC = () => {
  const [autoPulseActive, setAutoPulseActive] = useState<boolean>(true);
  const [pulseDuration, setPulseDuration] = useState<number>(12);
  const [moistureMin, setMoistureMin] = useState<number>(30);
  const [moistureMax, setMoistureMax] = useState<number>(60);
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [manualTriggerExecuted, setManualTriggerExecuted] = useState<boolean>(false);

  const eventLogs = [
    { timestamp: '14:32:10', trigger: 'AUTO_THRESHOLD', duration: '12s', doseMl: '0ml (Water)', status: 'COMPLETED' },
    { timestamp: '10:48:00', trigger: 'AUTO_THRESHOLD', duration: '12s', doseMl: '10ml NPK', status: 'COMPLETED' },
    { timestamp: '06:00:15', trigger: 'SCHEDULED', duration: '15s', doseMl: '0ml (Water)', status: 'COMPLETED' },
  ];

  const handleExecuteManualOverride = () => {
    setManualTriggerExecuted(true);
    setConfirmModalOpen(false);
    setTimeout(() => setManualTriggerExecuted(false), 4000);
  };

  return (
    <section id="irrigation" className="relative py-20 px-4 lg:px-8 bg-[#FAFAF8] border-t border-gray-200">
      {/* Background Video #5 with 90% White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the (1).mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover bg-video-desaturated opacity-20"
        />
        <div className="absolute inset-0 bg-white/90" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Hydraulics & Safety Control</span>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A]">Irrigation Automation Control Center</h2>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-[#E8F5E9] text-[#2D5A3D] border border-[#A5D6A7] text-xs font-bold rounded-full">
              Autonomy Level: L2 Supervised
            </span>
          </div>
        </div>

        {/* Visual SVG Hydraulic Pipeline Diagram */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
            Hydraulic Pipeline Flow Diagram (Reservoir → Pump → Grow Units → Return)
          </h3>

          <div className="relative overflow-x-auto py-4">
            <svg className="w-full min-w-[700px] h-32" viewBox="0 0 800 120">
              {/* Pipe Path */}
              <path d="M 50 60 L 250 60 L 450 60 L 650 60 L 750 60" stroke="#E5E7EB" strokeWidth="12" fill="none" strokeLinecap="round" />

              {/* Animated Water Flow Line */}
              <path
                d="M 50 60 L 250 60 L 450 60 L 650 60 L 750 60"
                stroke="#0284c7"
                strokeWidth="6"
                fill="none"
                className="animate-water-flow"
              />

              {/* Node 1: Reservoir */}
              <g transform="translate(50, 60)">
                <circle r="24" fill="#E0F2FE" stroke="#0284c7" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0369a1">Reservoir</text>
              </g>

              {/* Node 2: Dosing Pump */}
              <g transform="translate(250, 60)">
                <circle r="24" fill="#E8F5E9" stroke="#2D5A3D" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2D5A3D">Pump</text>
              </g>

              {/* Node 3: Grow Units */}
              <g transform="translate(450, 60)">
                <circle r="24" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#B45309">Grow Units</text>
              </g>

              {/* Node 4: Return Loop */}
              <g transform="translate(650, 60)">
                <circle r="24" fill="#F3E8FF" stroke="#7E22CE" strokeWidth="2" />
                <text y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6B21A8">Return</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Controls & Threshold Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* iOS Toggle & Thresholds */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">Auto Moisture Pulse</span>
              {/* iOS Style Toggle Switch */}
              <button
                onClick={() => setAutoPulseActive(!autoPulseActive)}
                className={`w-12 h-6 rounded-full p-1 transition duration-200 ease-in-out ${
                  autoPulseActive ? 'bg-[#059669]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-md transform transition duration-200 ease-in-out ${
                    autoPulseActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Threshold Sliders */}
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Min Moisture Threshold:</span>
                  <span className="font-mono font-bold text-[#2D5A3D]">{moistureMin}%</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="45"
                  value={moistureMin}
                  onChange={(e) => setMoistureMin(parseInt(e.target.value))}
                  className="w-full accent-[#2D5A3D]"
                />
              </div>

              <div>
                <div className="flex justify-between text-gray-600 mb-1">
                  <span>Max Moisture Ceiling:</span>
                  <span className="font-mono font-bold text-[#2D5A3D]">{moistureMax}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="80"
                  value={moistureMax}
                  onChange={(e) => setMoistureMax(parseInt(e.target.value))}
                  className="w-full accent-[#2D5A3D]"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-600">Pulse Duration:</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    value={pulseDuration}
                    onChange={(e) => setPulseDuration(parseInt(e.target.value) || 12)}
                    className="w-16 bg-[#FAFAF8] border border-gray-300 rounded-lg px-2 py-1 text-center font-mono font-bold text-gray-900"
                  />
                  <span className="text-gray-500 font-mono">sec</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule & Cooldown Display */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#7CB342]" />
              <span>Weekly Schedule & Cooldown</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-100 flex justify-between items-center font-mono">
                <span className="text-gray-600">Mandatory Mixing Delay:</span>
                <span className="font-bold text-[#059669]">00:15:00 Expired</span>
              </div>
              <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-100 flex justify-between items-center font-mono">
                <span className="text-gray-600">Next Scheduled Pulse:</span>
                <span className="font-bold text-gray-900">Tomorrow 06:00 AM</span>
              </div>
            </div>
          </div>

          {/* Manual Override Button with Confirmation Dialog */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Manual Actuation Safety Interlock</h3>
              <p className="text-xs text-gray-500 mt-1">
                Direct manual triggers require human confirmation dialog to satisfy platform Invariant Rule 1.
              </p>
            </div>

            {manualTriggerExecuted ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Manual Pulse Proposal Dispatched & Verified</span>
              </div>
            ) : (
              <button
                onClick={() => setConfirmModalOpen(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full shadow-md transition flex items-center justify-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Manual Override Trigger (Requires Confirmation)</span>
              </button>
            )}
          </div>
        </div>

        {/* Event Log Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-3 p-6">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Irrigation Event Execution Log</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAFAF8] text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Trigger Type</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Fertilizer Dose</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {eventLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-bold text-gray-900">{log.timestamp}</td>
                    <td className="py-2.5 px-4">{log.trigger}</td>
                    <td className="py-2.5 px-4">{log.duration}</td>
                    <td className="py-2.5 px-4">{log.doseMl}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Safety Interlock Manual Confirmation Dialog Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-gray-900 text-sm">Human Confirmation Required</h3>
              </div>
              <button onClick={() => setConfirmModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Platform Invariant Rule 1: Confirm manual physical actuation of Water Pump ({pulseDuration}s duration). Safety interlocks are re-evaluated right before hardware dispatch.
            </p>

            <div className="p-3 bg-[#E8F5E9] rounded-xl text-xs font-mono text-[#2D5A3D] space-y-1">
              <div className="flex items-center space-x-1 font-bold">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                <span>Interlock Pass Checklist:</span>
              </div>
              <div>• E-Stop: Cleared</div>
              <div>• Mixing Delay: Expired</div>
              <div>• Level Floor: Safe (420mm &gt; 150mm)</div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteManualOverride}
                className="flex-1 py-2.5 bg-[#2D5A3D] hover:bg-[#234730] text-white font-bold text-xs rounded-full shadow transition"
              >
                Confirm Actuation
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
