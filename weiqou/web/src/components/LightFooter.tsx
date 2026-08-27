import React from 'react';
import { Sprout, ShieldCheck } from 'lucide-react';

export const LightFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-10 px-4 lg:px-8 text-xs text-gray-500 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold">
              <Sprout className="w-3.5 h-3.5 text-[#7CB342]" />
            </div>
            <span className="font-extrabold text-sm text-[#1B4332] uppercase font-display tracking-tight">
              TERRASUB & SOLAR-DA v3.0 OS
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-3.5 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full font-mono text-[11px] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>All 13 Safety Invariants Verified</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600 font-medium border-t border-gray-100 pt-4">
          <div className="flex space-x-6">
            <a href="#hero-section" className="hover:text-[#1B4332]">Documentation</a>
            <a href="#live-dashboard" className="hover:text-[#1B4332]">API Reference</a>
            <a href="#irrigation" className="hover:text-[#1B4332]">Safety Protocols</a>
            <a href="#market" className="hover:text-[#1B4332]">Privacy Policy</a>
            <a href="#community" className="hover:text-[#1B4332]">Contact Support</a>
          </div>

          <span className="font-mono text-[11px] text-gray-400">
            © 2026 TerraSub & Solar-Da v3.0 — Proprietary Agricultural Intelligence
          </span>
        </div>
      </div>
    </footer>
  );
};
