import React, { useState } from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { Sprout, Bell, Layers, Cpu, AlertTriangle, User, ChevronDown, CheckCircle, Shield } from 'lucide-react';

interface StickyNavbarProps {
  mode: ProductMode;
  setMode: (m: ProductMode) => void;
  eStopActive: boolean;
  toggleEStop: () => void;
  unreadAlertsCount: number;
  onOpenSmsCenter: () => void;
}

export const StickyNavbar: React.FC<StickyNavbarProps> = ({
  mode,
  setMode,
  eStopActive,
  toggleEStop,
  unreadAlertsCount,
  onOpenSmsCenter,
}) => {
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 h-[64px] bg-white border-b border-gray-200 shadow-sm px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Brand Logo */}
      <div className="flex items-center space-x-3">
        <a href="#hero" className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#2D5A3D] text-white flex items-center justify-center shadow-sm group-hover:bg-[#234730] transition">
            <Sprout className="w-5 h-5 text-[#7CB342]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-base text-[#2D5A3D] tracking-tight">TerraSub & Solar-Da</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2D5A3D] border border-[#A5D6A7]">v3.0</span>
            </div>
          </div>
        </a>
      </div>

      {/* Center: Product Mode Toggle Pills */}
      <div className="hidden md:flex items-center bg-[#FAFAF8] p-1 rounded-full border border-gray-200 shadow-inner">
        <button
          onClick={() => setMode('TERRASUB_MVP')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            mode === 'TERRASUB_MVP'
              ? 'bg-[#2D5A3D] text-white shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>TerraSub MVP</span>
        </button>
        <button
          onClick={() => setMode('SOLARDA_V3')}
          className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
            mode === 'SOLARDA_V3'
              ? 'bg-[#2D5A3D] text-white shadow-sm font-bold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Solar-Da v3</span>
        </button>
      </div>

      {/* Right: Anchored Nav Links */}
      <nav className="hidden lg:flex items-center space-x-6 text-xs font-medium text-gray-600">
        <a href="#live-dashboard" className="hover:text-[#2D5A3D] transition">Dashboard</a>
        <a href="#crop-doctor" className="hover:text-[#2D5A3D] transition">Crop Doctor</a>
        <a href="#irrigation" className="hover:text-[#2D5A3D] transition">Irrigation</a>
        <a href="#market" className="hover:text-[#2D5A3D] transition">Market</a>
        <a href="#community" className="hover:text-[#2D5A3D] transition">Community</a>
      </nav>

      {/* Far Right: E-Stop, SMS Bell & Profile */}
      <div className="flex items-center space-x-3">
        {/* E-STOP Hold Button */}
        <button
          onClick={toggleEStop}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow-sm ${
            eStopActive
              ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
          }`}
          title="Hardware E-STOP Interlock Override"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          <span className="hidden sm:inline">{eStopActive ? 'ESTOP ACTIVE' : 'E-STOP'}</span>
        </button>

        {/* SMS Notifications Bell */}
        <button
          onClick={onOpenSmsCenter}
          className="relative p-2 text-gray-600 hover:text-[#2D5A3D] hover:bg-gray-100 rounded-full transition"
          title="SMS Alerts & Notifications Center"
        >
          <Bell className="w-5 h-5" />
          {unreadAlertsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#F4A261] text-slate-950 font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition border border-gray-200"
          >
            <div className="w-7 h-7 rounded-full bg-[#2D5A3D] text-white flex items-center justify-center font-bold text-xs">
              M
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500 hidden sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 p-2 text-xs space-y-1 z-50">
              <div className="p-2 border-b border-gray-100">
                <span className="font-bold text-gray-900 block">Murugan Agro Co-op</span>
                <span className="text-gray-500 text-[11px] block">Tamil Nadu Region • Grower</span>
              </div>
              <a href="#live-dashboard" className="block p-2 hover:bg-gray-50 rounded-lg text-gray-700">Farm Devices & Telemetry</a>
              <a href="#sms-alerts" className="block p-2 hover:bg-gray-50 rounded-lg text-gray-700">SMS Notification Rules</a>
              <div className="p-2 text-emerald-700 font-semibold flex items-center space-x-1 border-t border-gray-100">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>All 13 Invariants Safe</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
