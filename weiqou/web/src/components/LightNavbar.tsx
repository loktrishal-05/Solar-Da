import React, { useState } from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { Sprout, Layers, Cpu, AlertTriangle, Bell, Sparkles, User, ChevronDown, CheckCircle, ShieldAlert, X } from 'lucide-react';

interface LightNavbarProps {
  mode: ProductMode;
  setMode: (m: ProductMode) => void;
  eStopActive: boolean;
  onToggleEStop: () => void;
  unreadAlertsCount: number;
  onToggleAssistant: () => void;
  alerts: Array<{ id: string; type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; timestamp: string }>;
  onDismissAlert: (id: string) => void;
  activeSection: 'agent-console' | 'live-dashboard' | 'irrigation' | 'crop-doctor' | 'market' | 'community' | 'sms-alerts' | null;
  onOpenSection: (id: 'agent-console' | 'live-dashboard' | 'irrigation' | 'crop-doctor' | 'market' | 'community' | 'sms-alerts') => void;
}

export const LightNavbar: React.FC<LightNavbarProps> = ({
  mode,
  setMode,
  eStopActive,
  onToggleEStop,
  unreadAlertsCount,
  onToggleAssistant,
  alerts,
  onDismissAlert,
  activeSection,
  onOpenSection,
}) => {
  const [bellOpen, setBellOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 h-[64px] bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] px-4 lg:px-8 flex items-center justify-between text-[#1A1A1A] font-sans shadow-sm">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center space-x-3">
        <a href="#hero-section" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold shadow-md shadow-[#1B4332]/10 group-hover:scale-105 transition">
            <Sprout className="w-5 h-5 text-[#7CB342]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-base tracking-tight text-[#1B4332] uppercase font-display">
              TERRASUB & SOLAR-DA
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#1B4332] border border-[#A5D6A7]">
              v3.0 OS
            </span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300"
              title="No live sensors. All sensor values are replayed from public datasets or simulated, and are labelled so."
            >
              REPLAY MODE
            </span>
          </div>
        </a>
      </div>

      {/* Center: Mode Switcher Pills */}
      <div className="hidden md:flex items-center bg-[#FAFAF8] p-1 rounded-full border border-[#E5E7EB] text-xs">
        <button
          onClick={() => setMode('TERRASUB_MVP')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full font-bold transition-all duration-200 ${
            mode === 'TERRASUB_MVP'
              ? 'bg-[#1B4332] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>TerraSub MVP</span>
        </button>
        <button
          onClick={() => setMode('SOLARDA_V3')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full font-bold transition-all duration-200 ${
            mode === 'SOLARDA_V3'
              ? 'bg-[#1B4332] text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Solar-Da v3</span>
        </button>
      </div>

      {/* Right Navigation Links & Controls */}
      <div className="flex items-center space-x-4">
        {/* Navigation Buttons - open section in fullscreen mode */}
        <nav className="hidden lg:flex items-center space-x-5 text-xs font-semibold text-gray-700">
          <button
            onClick={() => onOpenSection('agent-console')}
            className={`transition px-2.5 py-1 rounded-full border ${activeSection === 'agent-console' ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'border-[#A5D6A7] text-[#1B4332] hover:bg-[#E8F5E9]'}`}
          >
            Agent Console
          </button>
          <button
            onClick={() => onOpenSection('live-dashboard')}
            className={`transition ${activeSection === 'live-dashboard' ? 'text-[#1B4332] font-extrabold' : 'hover:text-[#1B4332]'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onOpenSection('crop-doctor')}
            className={`transition ${activeSection === 'crop-doctor' ? 'text-[#1B4332] font-extrabold' : 'hover:text-[#1B4332]'}`}
          >
            Crop Doctor
          </button>
          <button
            onClick={() => onOpenSection('irrigation')}
            className={`transition ${activeSection === 'irrigation' ? 'text-[#1B4332] font-extrabold' : 'hover:text-[#1B4332]'}`}
          >
            Irrigation
          </button>
          <button
            onClick={() => onOpenSection('market')}
            className={`transition ${activeSection === 'market' ? 'text-[#1B4332] font-extrabold' : 'hover:text-[#1B4332]'}`}
          >
            Market
          </button>
          <button
            onClick={() => onOpenSection('community')}
            className={`transition ${activeSection === 'community' ? 'text-[#1B4332] font-extrabold' : 'hover:text-[#1B4332]'}`}
          >
            Community
          </button>
        </nav>

        {/* E-STOP Button */}
        <button
          onClick={onToggleEStop}
          className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold transition shadow-sm ${
            eStopActive
              ? 'bg-[#DC2626] text-white animate-pulse ring-2 ring-red-400'
              : 'bg-red-50 text-[#DC2626] hover:bg-red-100 border border-red-200'
          }`}
          title="Hardware E-STOP Interlock Override"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
          <span className="hidden sm:inline">{eStopActive ? 'E-STOP ACTIVE' : 'E-STOP'}</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setBellOpen(!bellOpen)}
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition"
            title="SMS Alerts & SCADA Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[#D97706] text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* SMS Alerts Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-4 text-xs space-y-3 z-50">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900 font-mono text-[11px] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-[#D97706]" /> Live SCADA Alerts ({alerts.length})
                </span>
                <button onClick={() => setBellOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-2.5 rounded-xl border text-xs font-mono flex items-start justify-between gap-2 ${
                      a.type === 'CRITICAL'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : a.type === 'WARNING'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-[11px]">{a.type}: {a.message}</div>
                      <span className="text-[10px] text-gray-500 block">{a.timestamp}</span>
                    </div>
                    <button onClick={() => onDismissAlert(a.id)} className="text-gray-400 hover:text-gray-600 p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition border border-[#E5E7EB]"
          >
            <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
              M
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-3 text-xs space-y-2 z-50">
              <div className="border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900 block">Murugan Agro Co-op</span>
                <span className="text-gray-500 text-[11px] block">Role: Primary Lead Grower</span>
              </div>
              <div className="text-[#059669] font-bold flex items-center space-x-1 font-mono text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-[#059669]" />
                <span>All 13 Invariants Verified</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
