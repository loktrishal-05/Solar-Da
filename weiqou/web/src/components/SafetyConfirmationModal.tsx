import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldCheck, X, RefreshCw } from 'lucide-react';

interface SafetyConfirmationModalProps {
  isOpen: boolean;
  actionType: 'IRRIGATE' | 'DOSE' | 'ADJUST' | 'FAN' | 'MIST' | 'REBOOT' | null;
  onClose: () => void;
  onConfirm: (actionName: string, detail: string) => void;
}

export const SafetyConfirmationModal: React.FC<SafetyConfirmationModalProps> = ({
  isOpen,
  actionType,
  onClose,
  onConfirm,
}) => {
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  if (!isOpen || !actionType) return null;

  const actionMeta = {
    IRRIGATE: {
      title: 'Irrigate Grow Unit G-04',
      params: '12-second moisture pulse | ~250ml cold water',
      risk: 'LOW',
      check1: 'Moisture below 35% setpoint (current 32%)',
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
      check1: 'Ambient RH 71% below max 85% ceiling',
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-[#D97706]">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-extrabold text-gray-900 text-sm tracking-tight">⚠️ CONFIRM SCADA ACTUATION</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Parameters Breakdown */}
        <div className="bg-[#FAFAF8] p-4 rounded-xl border border-gray-200 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-gray-900 font-bold font-sans text-sm">
            <span>Action: {actionMeta.title}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${actionMeta.risk === 'HIGH' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
              Risk: {actionMeta.risk}
            </span>
          </div>
          <div className="text-gray-600">Parameters: {actionMeta.params}</div>
          <div className="text-gray-500 text-[11px]">Triggered by: Manual (Operator User)</div>
        </div>

        {/* Safety Interlock Checklist */}
        <div className="space-y-2 text-xs">
          <span className="font-bold text-gray-900 flex items-center gap-1 font-mono uppercase text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#059669]" /> Safety Checklist Verification
          </span>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-1.5 font-mono text-[#059669]">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
              <span>{actionMeta.check1}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
              <span>{actionMeta.check2}</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
              <span>Hardware Pump/Relay Status: Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" />
              <span>No Active Hardware E-STOP Interlock</span>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            disabled={isExecuting}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-full transition"
          >
            CANCEL
          </button>

          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="flex-1 py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-bold text-xs rounded-full shadow-md transition flex items-center justify-center space-x-2"
          >
            {isExecuting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Executing Actuation...</span>
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
