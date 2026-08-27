import React from 'react';
import { Droplet, Microscope, Activity, TrendingUp, Bell, Users, ArrowUpRight } from 'lucide-react';

export const FeatureBentoGrid: React.FC = () => {
  const pillars = [
    {
      id: 'irrigation',
      title: 'Smart Irrigation & Fertigation',
      description: 'Threshold-triggered pulse logic for substrate and fixed-sequence dosing for CEA reservoirs.',
      icon: Droplet,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
      anchor: '#irrigation',
    },
    {
      id: 'crop-doctor',
      title: 'AI Crop Doctor Diagnostics',
      description: 'YOLOv11 lesion detection + EfficientNetV3 classification with tipburn discriminator & confidence abstention.',
      icon: Microscope,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      anchor: '#crop-doctor',
    },
    {
      id: 'plant-monitoring',
      title: 'Live Telemetry & Diagnostics',
      description: 'Real-time EC, pH, DO, temperature, load cell mass, and VPD monitoring with lab-validated trend proxies.',
      icon: Activity,
      iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
      anchor: '#live-dashboard',
    },
    {
      id: 'market-intel',
      title: 'Market Demand Intelligence',
      description: 'Transparent mandi price integration (Agmarknet) paired with price-trend & climate suitability scoring.',
      icon: TrendingUp,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      anchor: '#market',
    },
    {
      id: 'sms-alerts',
      title: 'SMS Alerts & Emergency Controls',
      description: 'Instant SMS notifications for critical threshold breaches, E-stop triggers, and daily harvest logs.',
      icon: Bell,
      iconBg: 'bg-orange-50 text-orange-600 border-orange-200',
      anchor: '#sms-alerts',
    },
    {
      id: 'farmer-community',
      title: 'Farmer Community & Co-ops',
      description: 'Connect with verified agronomists, form input purchasing co-ops, and share verified crop protocols.',
      icon: Users,
      iconBg: 'bg-[#E8F5E9] text-[#2D5A3D] border-[#A5D6A7]',
      anchor: '#community',
    },
  ];

  return (
    <section id="pillars" className="py-20 px-4 lg:px-8 bg-[#FAFAF8]">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Platform Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A]">
            The Six Pillars of Agricultural Safety
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            Every capability passes through strict control-plane safety pipelines with human-gated actuation surfaces.
          </p>
        </div>

        {/* 3x2 Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <a
                key={pillar.id}
                href={pillar.anchor}
                className="group bg-white p-6 rounded-xl border border-gray-200 shadow-sm card-hover-lift flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${pillar.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-[#2D5A3D] text-gray-400 group-hover:text-white flex items-center justify-center transition">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#2D5A3D] transition">
                    {pillar.title}
                  </h3>

                  <p className="text-xs text-gray-600 leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-[#2D5A3D]">
                  <span>Explore Module</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};
