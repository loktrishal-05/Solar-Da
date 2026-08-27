import React, { useState } from 'react';
import { Layers, Cpu, CheckCircle2, ShieldCheck, Droplets, Activity } from 'lucide-react';

export const ProductModeShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'TERRASUB' | 'SOLARDA'>('TERRASUB');

  return (
    <section id="showcase" className="py-20 px-4 lg:px-8 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Two Products — One Codebase</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A]">
            Architected for Substrate & Vertical Towers
          </h2>
          <p className="text-sm text-gray-500 font-normal">
            TerraSub and Solar-Da v3 serve different growing media and irrigation semantics without collapsing into one implicit model.
          </p>

          {/* Selector Switcher */}
          <div className="inline-flex p-1 bg-[#FAFAF8] rounded-full border border-gray-200 shadow-inner mt-4">
            <button
              onClick={() => setActiveTab('TERRASUB')}
              className={`flex items-center space-x-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'TERRASUB' ? 'bg-[#2D5A3D] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>TerraSub MVP</span>
            </button>
            <button
              onClick={() => setActiveTab('SOLARDA')}
              className={`flex items-center space-x-2 px-6 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === 'SOLARDA' ? 'bg-[#2D5A3D] text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Solar-Da v3</span>
            </button>
          </div>
        </div>

        {/* Showcase Split Cards */}
        {activeTab === 'TERRASUB' ? (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 p-8 lg:p-12 shadow-md">
            {/* Background Video #2 with White Overlay */}
            <div className="absolute inset-0 z-0">
              <video
                src="/media/STYLE_BIBLE_ABOVE___Using_the (2).mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover bg-video-desaturated opacity-30"
              />
              <div className="absolute inset-0 bg-white/90" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-[#E8F5E9] text-[#2D5A3D] px-3 py-1 rounded-full text-xs font-bold border border-[#A5D6A7]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Substrate-Led Horizontal Unit</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Biodegradable Substrate + Pulse Irrigation
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                  Solid organic media holds moisture. Controller fires moisture-threshold pulses instead of continuous recirculating flow. Sourced formula includes certified fish/poultry gelatin with hard tannery waste safety prohibition.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                  <span className="flex items-center space-x-1"><CheckCircle2 className="w-4 h-4 text-[#059669]" /><span>Organic Coco Coir Base</span></span>
                  <span className="flex items-center space-x-1"><CheckCircle2 className="w-4 h-4 text-[#059669]" /><span>10g Fish Gelatin Solution</span></span>
                </div>
              </div>

              {/* 3 Metric White Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Moisture Pulse</span>
                  <span className="font-mono text-2xl font-bold text-[#2D5A3D]">12 sec</span>
                  <span className="text-[10px] text-gray-400 block font-mono">Threshold &lt; 35%</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Gelatin Safety</span>
                  <span className="font-mono text-lg font-bold text-[#059669] block truncate">Fish/Poultry</span>
                  <span className="text-[10px] text-gray-400 block font-mono">No Tannery Waste</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Lab EC Proxy</span>
                  <span className="font-mono text-2xl font-bold text-[#2D5A3D]">1.55</span>
                  <span className="text-[10px] text-gray-400 block font-mono">mS/cm (Trend)</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 p-8 lg:p-12 shadow-md">
            {/* Background Video #3 with White Overlay */}
            <div className="absolute inset-0 z-0">
              <video
                src="/media/djhm.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover bg-video-desaturated opacity-30"
              />
              <div className="absolute inset-0 bg-white/90" />
            </div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-[#E0F2FE] text-[#0284c7] px-3 py-1 rounded-full text-xs font-bold border border-[#7DD3FC]">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Vertical CEA Aeroponic Tower Loop</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Bounded Reservoir & Chemistry Control
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                  Recirculating NFT/aeroponic towers fed by bounded nutrient reservoirs. Implements fixed dosing operation sequence (water → mix → read → dose → mix → read → pH → mix → read) and uptake ratio diagnostics.
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium text-gray-700">
                  <span className="flex items-center space-x-1"><CheckCircle2 className="w-4 h-4 text-[#059669]" /><span>Minimum Circulation Duty Floor</span></span>
                  <span className="flex items-center space-x-1"><CheckCircle2 className="w-4 h-4 text-[#059669]" /><span>Load Cell Mass Correlation</span></span>
                </div>
              </div>

              {/* 3 Metric White Cards */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Reservoir Vol</span>
                  <span className="font-mono text-2xl font-bold text-[#2D5A3D]">100 L</span>
                  <span className="text-[10px] text-gray-400 block font-mono">Load Cell Scaled</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Circulation Floor</span>
                  <span className="font-mono text-lg font-bold text-[#059669] block">100% Floor</span>
                  <span className="text-[10px] text-gray-400 block font-mono">Interlock Floor</span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center space-y-1">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Uptake State</span>
                  <span className="font-mono text-lg font-bold text-[#2D5A3D] block">Absorption</span>
                  <span className="text-[10px] text-gray-400 block font-mono">ΔMass / ΔEC</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
