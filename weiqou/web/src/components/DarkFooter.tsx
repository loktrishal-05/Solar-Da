import React from 'react';
import { Sprout, ShieldCheck } from 'lucide-react';

export const DarkFooter: React.FC = () => {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 py-10 px-4 lg:px-8 text-xs text-slate-400 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <Sprout className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <span className="font-extrabold text-sm text-white uppercase font-display tracking-tight">
              TERRASUB & SOLAR-DA v3.0
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 bg-teal-950/60 text-teal-300 border border-teal-500/30 rounded-full font-mono text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All 13 Safety Invariants Verified</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-[11px] font-mono text-slate-500 border-t border-white/5 pt-4">
          <span>TerraSub & Solar-Da v3.0 — Proprietary Agricultural Intelligence & Fertigation Safety Platform</span>
          <span>Built on Verifiable Smart Contracts & Firmware Safety Interlocks</span>
        </div>
      </div>
    </footer>
  );
};
