import React from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { ShieldAlert, Sparkles, AlertTriangle, Layers, Cpu, Sprout } from 'lucide-react';

interface HeaderProps {
  mode: ProductMode;
  setMode: (m: ProductMode) => void;
  eStopActive: boolean;
  toggleEStop: () => void;
  openChat: () => void;
  openRedTeam: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  eStopActive,
  toggleEStop,
  openChat,
  openRedTeam,
}) => {
  return (
    <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6 pointer-events-none mb-6">
      <div className="glass-pill rounded-full px-5 py-3 flex items-center justify-between pointer-events-auto shadow-2xl border border-white/10">
        {/* Brand & Mode Indicator */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg flex items-center justify-center">
            <Sprout className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-display font-extrabold text-sm tracking-tight text-white">TERRASUB & SOLAR-DA</span>
              <span className="eyebrow-quiet text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">v3.0</span>
            </div>
          </div>
        </div>

        {/* Mode Switcher Pill */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-full border border-white/10">
          <button
            onClick={() => setMode('TERRASUB_MVP')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              mode === 'TERRASUB_MVP'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>TerraSub MVP</span>
          </button>
          <button
            onClick={() => setMode('SOLARDA_V3')}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
              mode === 'SOLARDA_V3'
                ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Solar-Da v3</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* E-Stop */}
          <button
            onClick={toggleEStop}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              eStopActive
                ? 'bg-red-500/90 text-white animate-pulse ring-2 ring-red-400'
                : 'bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/40'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{eStopActive ? 'E-STOP' : 'E-STOP'}</span>
          </button>

          {/* Red-Team Safety Test */}
          <button
            onClick={openRedTeam}
            className="p-2 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 rounded-full border border-purple-800/40 transition"
            title="Run Adversarial Prompt Injection Test"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>

          {/* Gemini Assistant Toggle */}
          <button
            onClick={openChat}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-full border border-white/20 transition shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden md:inline">Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};
