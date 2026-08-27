import React from 'react';
import { Droplets, Microscope, Activity, TrendingUp, Bell, Users, ArrowRight } from 'lucide-react';

type SectionId = 'live-dashboard' | 'irrigation' | 'crop-doctor' | 'market' | 'community' | 'sms-alerts';

interface LightBentoGridSectionProps {
  onOpenSection: (id: SectionId) => void;
}

export const LightBentoGridSection: React.FC<LightBentoGridSectionProps> = ({ onOpenSection }) => {
  const pillars: Array<{
    id: SectionId;
    title: string;
    desc: string;
    icon: typeof Droplets;
    accentBg: string;
  }> = [
    {
      id: 'irrigation',
      title: 'Smart Irrigation Control',
      desc: 'Single-click pulse actuation with animated SVG hydraulic pipeline & safety interlocks.',
      icon: Droplets,
      accentBg: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'crop-doctor',
      title: 'AI Crop Doctor',
      desc: 'MobileNet-PlantVillage in-browser disease detection with mandatory 75% confidence gate.',
      icon: Microscope,
      accentBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'live-dashboard',
      title: 'Live Plant Telemetry',
      desc: 'Real-time substrate moisture, EC total salt proxy, pH, ambient temperature & humidity sparklines.',
      icon: Activity,
      accentBg: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'market',
      title: 'Market Demand Intelligence',
      desc: 'Agmarknet Mandi price trends paired with climate & substrate suitability heuristic crop scores.',
      icon: TrendingUp,
      accentBg: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'sms-alerts',
      title: 'SMS Alerts & Notifications',
      desc: 'Real-time SMS dispatch log with severity classification (Critical, Warning, Info) & category toggles.',
      icon: Bell,
      accentBg: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'community',
      title: 'Farmer Community Co-op',
      desc: 'Connect with verified agronomists, form bulk input co-ops, and share crop observation logs.',
      icon: Users,
      accentBg: 'bg-green-50 text-[#1B4332] border-green-200',
    },
  ];

  return (
    <section className="bg-[#FAFAF8] py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342] font-mono">Platform Capabilities</span>
          <h2 className="text-3xl font-extrabold text-[#1A1A1A]">The Six Pillars of Precision Agricultural OS</h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Everything needed to monitor, diagnose, irrigate, trade, and collaborate — grounded in nature and protected by safety interlocks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onOpenSection(p.id)}
                className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between space-y-4 group text-left w-full"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border font-bold ${p.accentBg}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-lg text-[#1A1A1A] group-hover:text-[#1B4332] transition">
                    {p.title}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{p.desc}</p>
                </div>

                <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1B4332] font-mono pt-2 border-t border-gray-100">
                  <span>Open Section</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
