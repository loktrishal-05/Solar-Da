import React from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { ArrowRight, ShieldCheck, Droplets, Zap, Activity, Sprout } from 'lucide-react';

interface LightHeroSectionProps {
  mode: ProductMode;
  eStopActive: boolean;
  onOpenSection: (id: 'live-dashboard' | 'irrigation' | 'crop-doctor' | 'market' | 'community' | 'sms-alerts') => void;
}

export const LightHeroSection: React.FC<LightHeroSectionProps> = ({ mode, eStopActive, onOpenSection }) => {
  return (
    <section id="hero-section" className="relative min-h-[80vh] flex items-center overflow-hidden py-20 px-4 lg:px-8 bg-[#FAFAF8]">
      {/* Video Background #1 — Aerial Greenhouse Footage with Heavy White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter saturate-[0.85] brightness-105"
        />
        {/* Heavy Light Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAFAF8]/95 via-[#FAFAF8]/80 to-[#FAFAF8]/95" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Headline & Subheadline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#E8F5E9] border border-[#A5D6A7] px-4 py-1.5 rounded-full text-xs font-bold text-[#1B4332]">
            <Sprout className="w-4 h-4 text-[#7CB342]" />
            <span className="uppercase font-mono tracking-wider">
              {mode === 'TERRASUB_MVP' ? 'TerraSub MVP Substrate Unit' : 'Solar-Da v3 Bounded Vertical CEA Tower'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#1A1A1A] tracking-tight leading-[1.15] font-display">
            Precision Agriculture <br />
            <span className="text-[#1B4332]">for Every Grower</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-2xl font-normal">
            From biodegradable substrate to vertical tower control — measure, explain, and grow with confidence. Built on 13 safety invariants and verifiable QR lot traceability.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => onOpenSection('live-dashboard')}
              className="px-8 py-4 bg-[#1B4332] hover:bg-[#143326] text-white text-sm font-extrabold rounded-full shadow-lg transition-all flex items-center space-x-2"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onOpenSection('community')}
              className="px-8 py-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-sm font-bold rounded-full transition shadow-sm"
            >
              Join Community
            </button>
          </div>
        </div>

        {/* Right: Clean White Telemetry Highlights Card */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-ping" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">Live Telemetry Snapshot</span>
            </div>
            <span className="text-xs font-mono text-gray-500">Active Unit: G-04 (Methi)</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-[#FAFAF8] p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px] font-sans block">Substrate Moisture</span>
              <span className="text-3xl font-black text-[#1B4332] block">28.5%</span>
              <span className="text-[10px] text-[#D97706] font-bold block font-mono">Below Min 35%</span>
            </div>

            <div className="bg-[#FAFAF8] p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-gray-500 text-[11px] font-sans block">EC Salt Proxy</span>
              <span className="text-3xl font-black text-[#059669] block">1.55</span>
              <span className="text-[10px] text-gray-500 block font-mono">mS/cm (Lab Baseline)</span>
            </div>
          </div>

          <div className="p-3.5 bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl text-xs font-mono text-[#1B4332] flex justify-between items-center">
            <span>Safety Interlocks:</span>
            <span className="font-bold flex items-center gap-1.5 text-[#059669]">
              <ShieldCheck className="w-4 h-4 text-[#059669]" /> ALL 13 INVARIANTS PASS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
