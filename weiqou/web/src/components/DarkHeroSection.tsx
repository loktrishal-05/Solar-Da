import React from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { Layers, Cpu, ShieldCheck, ArrowRight, Droplets, Zap, Activity, AlertOctagon } from 'lucide-react';

interface DarkHeroSectionProps {
  mode: ProductMode;
  eStopActive: boolean;
}

export const DarkHeroSection: React.FC<DarkHeroSectionProps> = ({ mode, eStopActive }) => {
  return (
    <section id="hero-section" className="relative min-h-[65vh] flex items-center overflow-hidden py-16 px-4 lg:px-8 bg-[#0a0a0a]">
      {/* Video Background #1 — Darkened Aerial Greenhouse Footage */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/STYLE_BIBLE_ABOVE___Using_the.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-105 filter brightness-[0.25] contrast-[1.15]"
        />
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/60 to-[#0a0a0a]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left: Oversized Bold Headline & Subheadline */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-teal-950/80 border border-teal-500/40 px-3.5 py-1.5 rounded-full text-xs font-bold text-teal-300 backdrop-blur-md">
            {mode === 'TERRASUB_MVP' ? <Layers className="w-4 h-4 text-teal-400" /> : <Cpu className="w-4 h-4 text-teal-400" />}
            <span className="uppercase font-mono tracking-wider">
              {mode === 'TERRASUB_MVP' ? 'Substrate-Led Horizontal Unit' : 'Bounded Vertical Tower CEA System'}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] font-display">
            {mode === 'TERRASUB_MVP' ? (
              <>
                Substrate Intelligence <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300">
                  & Pulse Irrigation
                </span>
              </>
            ) : (
              <>
                Reservoir Chemistry <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400">
                  & Vertical CEA Control
                </span>
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
            From biodegradable substrate to vertical tower control — measure, explain, and act within safe boundaries. Built on 13 safety invariants and verifiable QR lot traceability.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <a
              href="#reservoirs"
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 text-sm font-extrabold rounded-full shadow-lg shadow-teal-500/20 transition-all flex items-center space-x-2"
            >
              <span>Explore Live Telemetry</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Right: HERO SIGNAL FOCUS CARD (Dark Glassmorphism) */}
        <div className="lg:col-span-5 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 hover:border-teal-500/30 transition-all duration-300">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Hero Telemetry Focus</span>
            </div>
            <span className="text-xs font-mono text-slate-400">Active Node: G-04</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-slate-400 text-[11px] block font-mono">Soil Moisture</span>
              <span className="font-mono text-3xl font-black text-teal-300 block">28.5%</span>
              <span className="text-[10px] text-amber-400 font-bold block font-mono">Below Min 35%</span>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-1">
              <span className="text-slate-400 text-[11px] block font-mono">EC Trend Proxy</span>
              <span className="font-mono text-3xl font-black text-emerald-400 block">1.55</span>
              <span className="text-[10px] text-slate-400 font-mono block">mS/cm (Lab Verified)</span>
            </div>
          </div>

          <div className="p-3.5 bg-teal-950/60 border border-teal-500/30 rounded-2xl text-xs font-mono text-teal-300 flex justify-between items-center">
            <span>Safety Interlocks:</span>
            <span className="font-bold flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 13 INVARIANTS PASS
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
