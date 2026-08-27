import React from 'react';
import { ShieldCheck, Sprout } from 'lucide-react';

export const ScadaFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6 px-4 lg:px-6 font-sans text-xs text-gray-500">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-[11px]">
        {/* Left */}
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-[#1B4332] text-white flex items-center justify-center font-bold">
            <Sprout className="w-3 h-3 text-[#7CB342]" />
          </div>
          <span className="font-bold text-gray-900 font-sans">TerraSub & Solar-Da v3.0</span>
          <span>| Build 2026.08.26 SCADA</span>
        </div>

        {/* Center Badge */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full font-bold">
          <ShieldCheck className="w-4 h-4 text-[#059669]" />
          <span>All 13 Safety Invariants Verified</span>
        </div>

        {/* Right Links */}
        <div className="flex items-center space-x-4 font-sans font-medium text-gray-600">
          <a href="#hero-command" className="hover:text-[#1B4332]">Documentation</a>
          <a href="#interactive-reports" className="hover:text-[#1B4332]">API Ref</a>
          <a href="#irrigation-control" className="hover:text-[#1B4332]">Support</a>
          <a href="#operational-forum" className="hover:text-[#1B4332]">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};
