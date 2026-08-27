import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, X, RefreshCw } from 'lucide-react';

interface DarkSafetyModalProps {
  isOpen: boolean;
  actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT' | null;
  onClose: () => void;
  onConfirm: (actionName: string, detail: string) => void;
}

export const DarkSafetyModal: React.FC<DarkSafetyModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onConfirm,
}) => {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  if (!isOpen || !actionType) return null;

  const actionMeta = {
    IRRIGATE: {
      title: 'Irrigate Grow Unit G-04',
      params: '12-second moisture pulse | ~250ml water',
      risk: 'LOW',
      check1: 'Moisture below 35% setpoint (current 28.5%)',
      check2: 'Minimum 30 min cooldown elapsed',
    },
    DOSE: {
      title: 'Dose Nutrient Solution (Reservoir R-01)',
      params: 'Target EC: 2.0 mS/cm | Dose volume: 15ml NPK Stock A/B',
      risk: 'HIGH',
      check1: 'Load cell mass verified (100.2L > 15L floor)',
      check2: 'Mixing cycle mandatory 15 min scheduled',
    },
    ADJUST: {
      title: 'Adjust Substrate pH Balance',
      params: 'Target pH: 6.0 | Acid dose: 3ml Dilute Phosphoric',
      risk: 'HIGH',
      check1: 'Current pH 6.2 within acid dosing window',
      check2: 'Safety interlock: No prior pH dose in 60m',
    },
    FAN: {
      title: 'Activate Greenhouse Ventilation Fan',
      params: 'Duty cycle: 100% | Duration: 15 minutes',
      risk: 'LOW',
      check1: 'VPD calculation 1.05 kPa within target',
      check2: 'Relay 04 health: Normal',
    },
    MIST: {
      title: 'Trigger High-Pressure Canopy Misting',
      params: 'Duration: 5 seconds | Micro-droplet spray',
      risk: 'LOW',
      check1: 'Ambient RH 62% below max 85% ceiling',
      check2: 'No leaf wetness sensor fault',
    },
    REBOOT: {
      title: 'Reboot Microcontroller Node ESP32-A7',
      params: 'Soft restart | Watchdog timer reset',
      risk: 'HIGH',
      check1: 'Telemetry buffered locally in flash',
      check2: 'Relays fail-safe open during boot (3s)',
    },
  }[actionType];

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      onConfirm(actionMeta.title, actionMeta.params);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-slate-900/95 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl backdrop-blur-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2 text-amber-400">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-white text-sm tracking-tight uppercase font-mono">
              ⚠️ CONFIRM PHYSICAL ACTUATION
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Details */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/5 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-white font-bold font-sans text-sm">
            <span>Action: {actionMeta.title}</span>
            <span className={`px-2.5 py-0.5 rounded text-[10px] ${actionMeta.risk === 'HIGH' ? 'bg-red-950 text-red-400 border border-red-500/30' : 'bg-teal-950 text-teal-300 border border-teal-500/30'}`}>
              Risk: {actionMeta.risk}
            </span>
          </div>
          <div className="text-slate-300">Parameters: {actionMeta.params}</div>
          <div className="text-slate-500 text-[11px]">Triggered by: Operator (Human Gated)</div>
        </div>

        {/* Safety Checklist */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-white flex items-center gap-1 font-mono uppercase text-[11px]">
            <ShieldAlert className="w-4 h-4 text-emerald-400" /> Invariant Checklist Verification
          </span>
          <div className="bg-teal-950/40 p-3.5 rounded-2xl border border-teal-500/30 space-y-1.5 font-mono text-teal-300">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionMeta.check1}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionMeta.check2}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Hardware Relay Status: Normal</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>No Active Hardware E-STOP Interlock</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-full border border-white/10 transition"
          >
            CANCEL
          </button>

          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition flex items-center justify-center space-x-2"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Dispatching Hardware...</span>
              </>
            ) : (
              <span>CONFIRM & EXECUTE</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
