import React, { useState } from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { Sprout, Layers, Cpu, AlertTriangle, Bell, Sparkles, User, ChevronDown, CheckCircle, ShieldAlert, X } from 'lucide-react';

interface DarkTopNavbarProps {
  mode: ProductMode;
  setMode: (m: ProductMode) => void;
  eStopActive: boolean;
  onToggleEStop: () => void;
  unreadAlertsCount: number;
  onToggleAssistant: () => void;
  alerts: Array<{ id: string; type: 'CRITICAL' | 'WARNING' | 'INFO'; message: string; timestamp: string }>;
  onDismissAlert: (id: string) => void;
}

export const DarkTopNavbar: React.FC<DarkTopNavbarProps> = ({
  mode,
  setMode,
  eStopActive,
  onToggleEStop,
  unreadAlertsCount,
  onToggleAssistant,
  alerts,
  onDismissAlert,
}) => {
  const [bellDropdownOpen, setBellDropdownOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 h-[60px] bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 px-4 lg:px-8 flex items-center justify-between text-slate-100 font-sans">
      {/* Left: Brand Logo & Title */}
      <div className="flex items-center space-x-3">
        <a href="#hero-section" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold shadow-lg shadow-teal-500/10 group-hover:scale-105 transition">
            <Sprout className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm tracking-tight text-white uppercase font-display">
              TERRASUB & SOLAR-DA
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-500/30">
              v3.0
            </span>
          </div>
        </a>
      </div>

      {/* Center: Mode Switcher Pills */}
      <div className="hidden md:flex items-center bg-white/5 p-1 rounded-full border border-white/10 text-xs">
        <button
          onClick={() => setMode('TERRASUB_MVP')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full font-semibold transition-all duration-200 ${
            mode === 'TERRASUB_MVP'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>TerraSub MVP</span>
        </button>
        <button
          onClick={() => setMode('SOLARDA_V3')}
          className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full font-semibold transition-all duration-200 ${
            mode === 'SOLARDA_V3'
              ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Solar-Da v3</span>
        </button>
      </div>

      {/* Right Controls: E-STOP, Assistant Icon, Bell Dropdown & Profile */}
      <div className="flex items-center space-x-3">
        {/* Hardware E-STOP Red Button (Always Visible) */}
        <button
          onClick={onToggleEStop}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-lg ${
            eStopActive
              ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400 shadow-red-600/50'
              : 'bg-red-950/40 text-red-400 hover:bg-red-950/80 border border-red-500/40'
          }`}
          title="Hardware E-STOP Interlock Override"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          <span className="hidden sm:inline">{eStopActive ? 'E-STOP ACTIVE' : 'E-STOP'}</span>
        </button>

        {/* Gemini Multimodal Assistant Button (Purple/Blue Glass) */}
        <button
          onClick={onToggleAssistant}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-900/60 to-indigo-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 text-purple-200 border border-purple-500/30 rounded-full text-xs font-bold transition shadow-lg backdrop-blur-md"
          title="Open Gemini Multimodal Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <span className="hidden sm:inline">Assistant</span>
        </button>

        {/* SMS Notifications Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setBellDropdownOpen(!bellDropdownOpen)}
            className="relative p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition"
            title="SMS Alerts & SCADA Notifications"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* SMS Alerts Dropdown Panel */}
          {bellDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 text-xs space-y-3 z-50">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="font-bold text-white uppercase font-mono text-[11px] flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-400" /> Live SCADA Alerts ({alerts.length})
                </span>
                <button onClick={() => setBellDropdownOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className={`p-2.5 rounded-xl border text-xs font-mono flex items-start justify-between gap-2 ${
                      a.type === 'CRITICAL'
                        ? 'bg-red-950/40 border-red-500/40 text-red-200'
                        : a.type === 'WARNING'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-blue-950/40 border-blue-500/40 text-blue-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-[11px]">{a.type}: {a.message}</div>
                      <span className="text-[10px] text-slate-400 block">{a.timestamp}</span>
                    </div>
                    <button
                      onClick={() => onDismissAlert(a.id)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-white/10 transition border border-white/10"
          >
            <div className="w-7 h-7 rounded-full bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              M
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 text-xs space-y-2 z-50">
              <div className="border-b border-white/10 pb-2">
                <span className="font-bold text-white block">Murugan Agro Co-op</span>
                <span className="text-slate-400 text-[11px] block">Role: Primary Lead Grower</span>
              </div>
              <div className="text-emerald-400 font-bold flex items-center space-x-1 font-mono text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
                <span>All 13 Invariants Verified</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
