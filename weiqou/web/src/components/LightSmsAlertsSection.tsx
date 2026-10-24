import React, { useEffect, useState } from 'react';
import { Bell, ShieldCheck, CheckCircle2, AlertTriangle, Info, Settings, Smartphone } from 'lucide-react';

interface LightSmsAlertsSectionProps {
  alerts: Array<{ id: string; type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; timestamp: string }>;
  onDismissAlert: (id: string) => void;
}

export const LightSmsAlertsSection: React.FC<LightSmsAlertsSectionProps> = ({ alerts, onDismissAlert }) => {
  const [outbox, setOutbox] = useState<Array<{ id: string; at: string; severity: string; text: string; channel: string; status: string }>>([]);
  const loadOutbox = () => fetch('/api/sms/outbox').then((r) => r.json()).then((d) => setOutbox(d.messages ?? [])).catch(() => {});
  useEffect(() => { loadOutbox(); const t = setInterval(loadOutbox, 8000); return () => clearInterval(t); }, []);
  const sendTest = () => fetch('/api/sms/test', { method: 'POST' }).then(loadOutbox).catch(() => {});
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [warningSmsOn, setWarningSmsOn] = useState<boolean>(true);
  const [infoSmsOn, setInfoSmsOn] = useState<boolean>(false);

  const filtered = filterType === 'ALL' ? alerts : alerts.filter((a) => a.type === filterType);

  return (
    <section id="alerts" className="bg-[#FAFAF8] py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-extrabold text-[#1A1A1A]">SMS Notifications & Alerts Center</h2>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Demo gateway: alerts from the safety engine are written to an outbox (replayed data). Real SMS needs a paid provider; optional free Telegram push is supported.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full">
              DEMO GATEWAY (simulated SMS)
            </span>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: ALERTS LOG LIST */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex space-x-1 text-xs font-mono">
                {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t as any)}
                    className={`px-3 py-1 rounded-full font-bold transition ${
                      filterType === t ? 'bg-[#1B4332] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-500 font-mono">Total Logged: {alerts.length}</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-3 ${
                    a.type === 'CRITICAL'
                      ? 'bg-red-50 border-red-200 border-l-4 border-l-red-600 text-red-900'
                      : a.type === 'WARNING'
                      ? 'bg-amber-50 border-amber-200 border-l-4 border-l-amber-500 text-amber-900'
                      : 'bg-blue-50 border-blue-200 border-l-4 border-l-blue-500 text-blue-900'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 font-bold font-sans">
                      {a.type === 'CRITICAL' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                      {a.type === 'WARNING' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {a.type === 'INFO' && <Info className="w-4 h-4 text-blue-600" />}
                      <span>{a.type}: {a.message}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 block">Timestamp: {a.timestamp} | Unit: G-04</span>
                  </div>

                  <button
                    onClick={() => onDismissAlert(a.id)}
                    className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold rounded-full text-[10px] transition"
                  >
                    ACKNOWLEDGE
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: SMS PREFERENCES & SAMPLE CARDS */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs font-mono">
              <div className="flex items-center space-x-2 text-gray-900 font-sans font-bold border-b border-gray-100 pb-2">
                <Settings className="w-4 h-4 text-[#1B4332]" />
                <span>SMS Dispatch Category Preferences</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-bold font-sans">Critical (E-STOP, Fault):</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded text-[10px]">LOCKED ON</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-sans font-semibold">Warning (Threshold):</span>
                  <button
                    onClick={() => setWarningSmsOn(!warningSmsOn)}
                    className={`w-10 h-5 rounded-full p-0.5 transition ${warningSmsOn ? 'bg-[#059669]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition ${warningSmsOn ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-900 font-sans font-semibold">Info (Market Updates):</span>
                  <button
                    onClick={() => setInfoSmsOn(!infoSmsOn)}
                    className={`w-10 h-5 rounded-full p-0.5 transition ${infoSmsOn ? 'bg-[#059669]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition ${infoSmsOn ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sample SMS Preview Card */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-gray-900 font-bold text-xs font-sans">
                <Smartphone className="w-4 h-4 text-[#1B4332]" />
                <span>Alert messages (demo gateway)</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto">
                {outbox.length === 0 && <p className="text-[11px] text-gray-500">No alerts sent yet. Press the button to send a test.</p>}
                {outbox.slice(0, 6).map((m) => (
                  <div key={m.id} className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 font-mono text-[11px] text-gray-800 space-y-1">
                    <span className="font-bold text-[#1B4332] block">{m.severity} · {m.at.slice(11, 19)} UTC</span>
                    <p className="leading-relaxed">{m.text}</p>
                    <span className={`text-[9px] font-bold block ${m.channel === 'telegram' ? 'text-[#059669]' : 'text-amber-700'}`}>{m.status}</span>
                  </div>
                ))}
              </div>
              <button onClick={sendTest} className="w-full py-2 text-xs font-bold rounded-xl bg-[#1B4332] text-white hover:opacity-90">Send test alert</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
