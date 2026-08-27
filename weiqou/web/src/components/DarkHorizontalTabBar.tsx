import React from 'react';
import { Film, Cpu, Activity, ShieldCheck, Camera, Sun, Calendar, QrCode, Droplets, TrendingUp, Users } from 'lucide-react';

interface DarkHorizontalTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingProposalsCount: number;
}

export const DarkHorizontalTabBar: React.FC<DarkHorizontalTabBarProps> = ({
  activeTab,
  setActiveTab,
  pendingProposalsCount,
}) => {
  const tabs = [
    { id: 'ref_gallery', label: 'Reference Media Gallery', icon: Film },
    { id: 'reservoirs', label: 'Reservoir & Tower Telemetry', icon: Cpu },
    { id: 'uptake_ratio', label: 'Uptake Ratio Diagnostic', icon: Activity },
    { id: 'human_confirmation', label: 'Human Confirmation Surface', icon: ShieldCheck, badge: pendingProposalsCount },
    { id: 'crop_doctor', label: 'Root Net-Port Diagnostics', icon: Camera },
    { id: 'power_sched', label: 'Solar-First Power Model', icon: Sun },
    { id: 'cea_plan', label: 'CEA Crop Planner', icon: Calendar },
    { id: 'passport', label: 'QR Traceability Passports', icon: QrCode },
    { id: 'irrigation_control', label: 'Irrigation Control', icon: Droplets, isNew: true },
    { id: 'market_intel', label: 'Market Intelligence', icon: TrendingUp, isNew: true },
    { id: 'community', label: 'Community', icon: Users, isNew: true },
  ];

  return (
    <div className="sticky top-[60px] z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20 font-extrabold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-teal-400'}`} />
              <span>{t.label}</span>

              {t.badge !== undefined && t.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                  isActive ? 'bg-slate-950 text-teal-300' : 'bg-red-500 text-white'
                }`}>
                  {t.badge}
                </span>
              )}

              {t.isNew && !isActive && (
                <span className="px-1.5 py-0.2 rounded bg-teal-950 text-teal-400 border border-teal-500/30 text-[9px] font-mono font-bold">
                  NEW
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
