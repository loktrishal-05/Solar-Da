import React from 'react';
import { Sprout, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-12 px-4 lg:px-8 text-xs text-gray-600">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-xl bg-[#2D5A3D] text-white flex items-center justify-center font-bold text-xs">
                <Sprout className="w-4 h-4 text-[#7CB342]" />
              </div>
              <span className="font-bold text-sm text-[#2D5A3D] tracking-tight">TerraSub & Solar-Da v3.0</span>
            </div>
            <p className="text-gray-500 max-w-md text-xs font-normal">
              Precision Agricultural Intelligence & Fertigation Safety Platform — Measure, explain, and grow safely.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <a href="#hero" className="hover:text-[#2D5A3D] transition">Documentation</a>
            <a href="#live-dashboard" className="hover:text-[#2D5A3D] transition">API Reference</a>
            <a href="#irrigation" className="hover:text-[#2D5A3D] transition">Safety Protocols</a>
            <a href="#market" className="hover:text-[#2D5A3D] transition">Privacy & Audit</a>
            <a href="#community" className="hover:text-[#2D5A3D] transition">Contact Co-op</a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-gray-500 font-mono">
          <div className="flex items-center space-x-1">
            <span>TerraSub & Solar-Da v3.0 — Proprietary Agricultural Intelligence</span>
          </div>

          <div className="flex items-center space-x-1 text-[#059669] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>All 13 Invariant Safety Checks Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
