import React from 'react';
import { ArrowRight, ShieldCheck, Sprout, Users, CheckCircle2 } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section id="hero" className="relative min-h-[80vh] flex items-center overflow-hidden py-20 px-4 lg:px-8 bg-[#FAFAF8]">
      {/* Background Video #1 with Heavy Light Gradient Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover bg-video-desaturated scale-105 opacity-40"
        />
        {/* HEAVY LIGHT GRADIENT OVERLAY MANDATE */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(250,250,248,0.92) 0%, rgba(250,250,248,0.75) 50%, rgba(250,250,248,0.90) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Headline & Content */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-[#E8F5E9] border border-[#A5D6A7] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#2D5A3D]">
            <Sprout className="w-4 h-4 text-[#7CB342]" />
            <span>Dual-Mode Agricultural Intelligence Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1A1A1A] tracking-tight leading-[1.15]">
            Precision Agriculture <br />
            <span className="text-[#2D5A3D]">for Every Grower</span>
          </h1>

          <p className="text-base sm:text-lg text-[#6B7280] leading-relaxed max-w-2xl font-normal">
            From biodegradable substrate to vertical tower control — measure, explain, and grow with confidence. Built on 13 safety invariants and verifiable traceability.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#live-dashboard"
              className="px-6 py-3.5 bg-[#2D5A3D] hover:bg-[#234730] text-white text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all flex items-center space-x-2"
            >
              <span>Enter Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#community"
              className="px-6 py-3.5 bg-white hover:bg-gray-50 text-[#2D5A3D] border border-[#2D5A3D]/30 text-sm font-semibold rounded-full shadow-sm transition-all flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-[#7CB342]" />
              <span>Join Community</span>
            </a>
          </div>

          {/* Trust Highlights */}
          <div className="pt-6 border-t border-gray-200/80 grid grid-cols-3 gap-4 text-xs font-medium text-gray-600">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>100% Human-Gated Actuation</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Lab-Validated Proxies</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>QR Traceable Lots</span>
            </div>
          </div>
        </div>

        {/* Right Hero Card: Telemetry Snapshot */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-md space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669] animate-pulse" />
              <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Live System Status</span>
            </div>
            <span className="text-xs font-mono text-gray-500">Org: Murugan Co-op</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[#FAFAF8] p-3.5 rounded-xl border border-gray-100">
              <span className="text-gray-500 block text-[11px]">Substrate Moisture</span>
              <span className="font-mono text-2xl font-bold text-[#2D5A3D]">28.5%</span>
              <span className="text-[10px] text-[#D97706] font-semibold block mt-0.5">Pulse Trigger Active</span>
            </div>

            <div className="bg-[#FAFAF8] p-3.5 rounded-xl border border-gray-100">
              <span className="text-gray-500 block text-[11px]">Uptake Ratio State</span>
              <span className="font-mono text-lg font-bold text-[#059669] truncate block">UPTAKE OK</span>
              <span className="text-[10px] text-gray-500 block mt-0.5">ΔEC -0.15 mS/cm</span>
            </div>
          </div>

          <div className="p-3 bg-[#E8F5E9] rounded-xl border border-[#A5D6A7] text-xs text-[#2D5A3D] flex items-center justify-between font-mono">
            <span>Safety Interlocks:</span>
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#059669]" /> ALL 13 INVARIANTS PASS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
