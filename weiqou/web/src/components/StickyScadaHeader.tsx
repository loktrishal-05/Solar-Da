import React, { useState } from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { Sprout, Layers, Cpu, AlertOctagon, Bell, ChevronDown, ShieldCheck, Zap, Droplets, Camera, TrendingUp, HelpCircle, User } from 'lucide-react';

interface StickyScadaHeaderProps {
  mode: ProductMode;
  setMode: (m: ProductMode) => void;
  eStopActive: boolean;
  onToggleEStop: () => void;
  unreadSmsCount: number;
  onOpenSmsPanel: () => void;
  onQuickAction: (action: string) => void;
}

export const StickyScadaHeader: React.FC<StickyScadaHeaderProps> = ({
  mode,
  setMode,
  eStopActive,
  onToggleEStop,
  unreadSmsCount,
  onOpenSmsPanel,
  onQuickAction,
}) => {
  const [quickMenuOpen, setQuickMenuOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-50 h-[56px] bg-white border-b border-gray-200 shadow-sm px-4 lg:px-6 flex items-center justify-between font-sans">
      {/* Left: Brand Logo & Version */}
      <div className="flex items-center space-x-3">
        <a href="#hero-command" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold shadow-sm">
            <Sprout className="w-4 h-4 text-[#7CB342]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-sm text-[#1A1A1A] tracking-tight">TerraSub & Solar-Da</span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#E8F5E9] text-[#1B4332] border border-[#A5D6A7]">
              v3.0 SCADA
            </span>
          </div>
        </a>
      </div>

      {/* Center-Left: Product Mode Switcher */}
      <div className="hidden md:flex items-center bg-gray-100 p-0.5 rounded-full border border-gray-200 text-xs">
        <button
          onClick={() => setMode('TERRASUB_MVP')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-semibold transition ${
            mode === 'TERRASUB_MVP' ? 'bg-[#1B4332] text-white shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>TerraSub MVP</span>
        </button>
        <button
          onClick={() => setMode('SOLARDA_V3')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-full font-semibold transition ${
            mode === 'SOLARDA_V3' ? 'bg-[#1B4332] text-white shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Solar-Da v3</span>
        </button>
      </div>

      {/* Center: Live SCADA System Status Bar */}
      <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-50 text-[#059669] border border-emerald-200 rounded-full font-bold">
          <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
          <span>● 4 Devices Online</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-50 text-[#D97706] border border-amber-200 rounded-full font-bold">
          <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
          <span>⚠ 1 Warning</span>
        </div>

        {/* E-STOP Red Outline Button */}
        <button
          onClick={onToggleEStop}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full font-bold transition ${
            eStopActive
              ? 'bg-red-600 text-white animate-pulse shadow-md ring-2 ring-red-400'
              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
          <span>{eStopActive ? '⛔ ESTOP ENGAGED' : '⛔ E-STOP Ready'}</span>
        </button>
      </div>

      {/* Right: Notifications, Quick Actions Dropdown & Profile */}
      <div className="flex items-center space-x-3">
        {/* SMS Notification Bell */}
        <button
          onClick={onOpenSmsPanel}
          className="relative p-2 text-gray-600 hover:text-[#1B4332] hover:bg-gray-100 rounded-full transition"
          title="SMS Alerts & Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadSmsCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-[#D97706] text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center shadow">
              {unreadSmsCount}
            </span>
          )}
        </button>

        {/* Quick Actions Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => setQuickMenuOpen(!quickMenuOpen)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-full shadow-sm transition"
          >
            <Zap className="w-3.5 h-3.5 text-[#7CB342]" />
            <span>Quick Actions</span>
            <ChevronDown className="w-3 h-3 text-white/80" />
          </button>

          {quickMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 text-xs space-y-1 z-50">
              <button
                onClick={() => {
                  onQuickAction('IRRIGATE');
                  setQuickMenuOpen(false);
                }}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center space-x-2 text-gray-800 font-semibold"
              >
                <Droplets className="w-3.5 h-3.5 text-blue-600" />
                <span>Irrigate Grow Unit G-04</span>
              </button>
              <button
                onClick={() => {
                  onQuickAction('SCAN');
                  setQuickMenuOpen(false);
                }}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center space-x-2 text-gray-800 font-semibold"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Scan Disease (Crop Doctor)</span>
              </button>
              <button
                onClick={() => {
                  onQuickAction('MARKET');
                  setQuickMenuOpen(false);
                }}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center space-x-2 text-gray-800 font-semibold"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                <span>Check Mandi Prices</span>
              </button>
              <button
                onClick={() => {
                  onQuickAction('EXPERT');
                  setQuickMenuOpen(false);
                }}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center space-x-2 text-gray-800 font-semibold border-t border-gray-100"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Ask Agronomist Expert</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar with Role Badge */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition border border-gray-200"
          >
            <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs">
              M
            </div>
            <span className="hidden sm:inline text-xs font-bold text-gray-800">Grower</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs space-y-2 z-50">
              <div className="border-b border-gray-100 pb-2">
                <span className="font-bold text-gray-900 block">Murugan Co-op Farm</span>
                <span className="text-gray-500 text-[11px] block">Role: Primary Lead Grower</span>
              </div>
              <div className="text-[#059669] font-bold flex items-center space-x-1 font-mono text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>All 13 Invariants Verified</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
