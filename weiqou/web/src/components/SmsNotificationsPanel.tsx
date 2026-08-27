import React, { useState } from 'react';
import { Bell, X, ShieldAlert, CheckCircle2, Settings, Smartphone } from 'lucide-react';

interface SmsNotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmsNotificationsPanel: React.FC<SmsNotificationsPanelProps> = ({ isOpen, onClose }) => {
  const [criticalAck, setCriticalAck] = useState<boolean>(false);
  const [warningPref, setWarningPref] = useState<boolean>(true);
  const [infoPref, setInfoPref] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl font-sans">
      {/* Panel Header */}
      <div className="p-4 bg-[#1B4332] text-white flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-[#7CB342]" />
          <div>
            <h3 className="font-bold text-sm">Alerts & SMS Notifications</h3>
            <span className="text-[10px] font-mono text-emerald-200 block">SCADA Alarm Dispatch Engine</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[#143326] rounded-full text-white/80 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notifications Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-[#FAFAF8]">
        {/* CRITICAL ALERTS (Red) */}
        <div className="space-y-2">
          <span className="font-bold text-red-700 uppercase font-mono text-[11px] block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" /> CRITICAL ALERTS (Mandatory Dispatch)
          </span>

          {!criticalAck ? (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2 font-mono text-red-900 shadow-sm">
              <div className="font-bold">E-STOP Triggered on Reservoir R-02</div>
              <p className="text-[11px] font-sans text-red-800">pH 8.9 exceeded max 8.5 ceiling. Circulation pump held in safe state.</p>
              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => setCriticalAck(true)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-[10px] shadow"
                >
                  ACKNOWLEDGE
                </button>
                <a href="#irrigation-control" onClick={onClose} className="px-3 py-1 bg-white border border-red-300 text-red-700 font-bold rounded text-[10px]">
                  VIEW SCADA
                </a>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-mono font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Critical Alarm Acknowledged</span>
            </div>
          )}
        </div>

        {/* WARNING ALERTS (Amber) */}
        <div className="space-y-2">
          <span className="font-bold text-amber-700 uppercase font-mono text-[11px] block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> WARNING ALERTS
          </span>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 font-mono text-amber-900">
            <div className="font-bold">G-07 Moisture Sensor Stale</div>
            <p className="text-[11px] font-sans text-amber-800">No packet received for 12 minutes from node ESP32-B2.</p>
            <div className="pt-1">
              <a href="#interactive-reports" onClick={onClose} className="px-3 py-1 bg-white border border-amber-300 text-amber-800 font-bold rounded text-[10px] inline-block">
                CHECK DEVICE
              </a>
            </div>
          </div>
        </div>

        {/* INFO ALERTS (Blue) */}
        <div className="space-y-2">
          <span className="font-bold text-blue-700 uppercase font-mono text-[11px] block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> INFORMATION ALERTS
          </span>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 font-mono text-blue-900">
            <div className="font-bold">Market Price Surge: Methi +12%</div>
            <p className="text-[11px] font-sans text-blue-800">Agmarknet Chennai mandi price reached ₹42/kg.</p>
          </div>
        </div>

        {/* SMS Category Toggle Preferences */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 pt-3">
          <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <span className="font-bold text-gray-900 text-xs">SMS Dispatch Settings</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Critical Alarms:</span>
              <span className="text-red-600 font-bold">LOCKED ON</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-700">Warning Breach SMS:</span>
              <button
                onClick={() => setWarningPref(!warningPref)}
                className={`w-8 h-4 rounded-full p-0.5 transition ${warningPref ? 'bg-[#059669]' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition ${warningPref ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-700">Daily Summary SMS:</span>
              <button
                onClick={() => setInfoPref(!infoPref)}
                className={`w-8 h-4 rounded-full p-0.5 transition ${infoPref ? 'bg-[#059669]' : 'bg-gray-300'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition ${infoPref ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
