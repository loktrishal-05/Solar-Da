import React, { useState } from 'react';
import { Bell, Smartphone, AlertTriangle, Info, CheckCircle2, ShieldAlert, X } from 'lucide-react';

interface SmsAlertsCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const SmsAlertsCenter: React.FC<SmsAlertsCenterProps> = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [criticalSmsOn] = useState<boolean>(true); // Mandatory ON
  const [warningSmsOn, setWarningSmsOn] = useState<boolean>(true);
  const [infoSmsOn, setInfoSmsOn] = useState<boolean>(false);

  const alertLogs = [
    {
      id: 'alert_01',
      timestamp: '14:32:10 Today',
      severity: 'CRITICAL',
      growUnit: 'Grow Unit G-04',
      message: 'ALERT: Grow Unit G-04 moisture 18% (threshold 35%). Auto-pulse triggered at 14:32.',
      status: 'LOGGED (sample, no SMS sent)',
    },
    {
      id: 'alert_02',
      timestamp: '10:48:00 Today',
      severity: 'WARNING',
      growUnit: 'Reservoir Loop Alpha',
      message: 'WARNING: EC 1.55 mS/cm below target 1.80 mS/cm. Proposal generated.',
      status: 'LOGGED (sample, no SMS sent)',
    },
    {
      id: 'alert_03',
      timestamp: '08:00:00 Today',
      severity: 'INFO',
      growUnit: 'System Platform',
      message: 'INFO: Daily morning agronomic telemetry report available for Murugan Co-op.',
      status: 'SKIPPED (Pref OFF)',
    },
  ];

  const filteredLogs = filter === 'ALL'
    ? alertLogs
    : alertLogs.filter((log) => log.severity === filter);

  return (
    <section id="sms-alerts" className="py-20 px-4 lg:px-8 bg-[#FAFAF8] border-t border-gray-200">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Mobile & Offline Safety</span>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A]">SMS Notifications & Alerts Center</h2>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-[#F4A261]/20 text-[#D97706] border border-[#F4A261]/40 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#D97706]" />
              <span>SMS gateway not connected: alerts are logged only</span>
            </span>
          </div>
        </div>

        {/* Sample SMS Card Preview */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 bg-[#FAFAF8] p-4 rounded-xl border border-gray-200 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-gray-500 text-[11px] border-b border-gray-200 pb-2">
              <span className="font-bold text-gray-900 flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-[#2D5A3D]" /> SMS Preview
              </span>
              <span>14:32 PM</span>
            </div>
            <p className="text-gray-800 leading-relaxed font-semibold">
              "ALERT: Grow Unit G-04 moisture 18% (threshold 35%). Auto-pulse triggered at 14:32."
            </p>
          </div>

          {/* Toggle Preferences per Category */}
          <div className="md:col-span-7 space-y-4 text-xs">
            <h3 className="font-bold text-gray-900 uppercase tracking-wider">SMS Dispatch Category Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <span className="font-bold text-red-700 block">1. Critical Alerts</span>
                <span className="text-gray-600 block text-[11px]">E-Stop, moisture failure</span>
                <span className="text-xs font-bold text-red-600 block pt-1">SMS ON (Mandatory)</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-800">2. Warnings</span>
                  <button
                    onClick={() => setWarningSmsOn(!warningSmsOn)}
                    className={`w-8 h-4 rounded-full p-0.5 transition ${warningSmsOn ? 'bg-[#059669]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition ${warningSmsOn ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <span className="text-gray-600 block text-[11px]">Threshold breaches</span>
                <span className="text-xs font-bold text-[#D97706] block pt-1">
                  {warningSmsOn ? 'SMS Enabled' : 'SMS Muted'}
                </span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-800">3. Information</span>
                  <button
                    onClick={() => setInfoSmsOn(!infoSmsOn)}
                    className={`w-8 h-4 rounded-full p-0.5 transition ${infoSmsOn ? 'bg-[#059669]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition ${infoSmsOn ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                <span className="text-gray-600 block text-[11px]">Daily summaries</span>
                <span className="text-xs font-bold text-blue-600 block pt-1">
                  {infoSmsOn ? 'SMS Enabled' : 'SMS Muted'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Severity Filter & Log Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">SMS Dispatch Log Table</h3>

            <div className="flex items-center space-x-2 text-xs">
              {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat as any)}
                  className={`px-3 py-1 rounded-full font-semibold transition ${
                    filter === cat ? 'bg-[#2D5A3D] text-white shadow-sm font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#FAFAF8] text-gray-500 uppercase border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Target Node</th>
                  <th className="py-2.5 px-4">Message Preview</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-bold text-gray-900">{log.timestamp}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.severity === 'CRITICAL'
                            ? 'bg-red-50 text-red-700'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-50 text-[#D97706]'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">{log.growUnit}</td>
                    <td className="py-2.5 px-4 max-w-md truncate font-sans text-gray-800">{log.message}</td>
                    <td className="py-2.5 px-4 font-bold text-emerald-700">{log.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
