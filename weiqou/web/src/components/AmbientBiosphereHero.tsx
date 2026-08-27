import React from 'react';
import { ProductMode } from '@terrasub-solarda/engine';
import { Activity, Droplets, ShieldCheck, Zap } from 'lucide-react';

interface AmbientBiosphereHeroProps {
  mode: ProductMode;
  eStopActive: boolean;
}

export const AmbientBiosphereHero: React.FC<AmbientBiosphereHeroProps> = ({ mode, eStopActive }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#090b10] p-8 md:p-12 mb-8 shadow-2xl">
      {/* Background Animated Morphing Liquid Orb (Module A Ambient Biosphere) */}
      <div className="absolute -top-24 -right-24 w-96 h-96 opacity-30 pointer-events-none blur-3xl">
        <div className="w-full h-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-sky-500 animate-liquid-orb rounded-full" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Headline & Hero Focus */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center space-x-3">
            <span className="eyebrow-quiet">PROPRIETARY ALGORITHMIC AGRONOMY PLATFORM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
            {mode === 'TERRASUB_MVP' ? (
              <>
                Substrate Sensing & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  Moisture Pulse Logic
                </span>
              </>
            ) : (
              <>
                Reservoir Chemistry & <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400">
                  Vertical CEA Control
                </span>
              </>
            )}
          </h1>

          <p className="text-sm text-slate-400 max-w-xl leading-relaxed font-light">
            {mode === 'TERRASUB_MVP'
              ? 'Horizontal grow units powered by fish/poultry-derived organic substrate. Sense soil moisture, calculate gelatin safety formulas, and detect plant diseases in-browser.'
              : 'Closed recirculating vertical aeroponic towers. Fixed-order safety fertigation pipeline, signature nutrient uptake ratio diagnostics, and QR traceability passports.'}
          </p>
        </div>

        {/* Right Hero Focus Telemetry Indicator */}
        <div className="lg:col-span-4 bg-slate-950/70 p-6 rounded-2xl border border-white/10 space-y-4 shadow-inner backdrop-blur-md">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <span className="eyebrow-quiet text-[10px]">HERO SIGNAL FOCUS</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">LIVE TELEMETRY</span>
          </div>

          <div className="space-y-3">
            {mode === 'TERRASUB_MVP' ? (
              <div>
                <span className="text-xs text-slate-400 block font-mono">SOIL MOISTURE PROBE</span>
                <div className="flex items-baseline space-x-2">
                  <span className="font-display text-4xl font-extrabold text-cyan-300">28.5%</span>
                  <span className="text-xs text-cyan-400 font-mono font-semibold">Pulse Trigger Active</span>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-xs text-slate-400 block font-mono">UPTAKE RATIO DIAGNOSTIC</span>
                <div className="flex items-baseline space-x-2">
                  <span className="font-display text-3xl font-extrabold text-emerald-400">NUTRIENT UPTAKE</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono block mt-1">ΔMass -1500g | ΔEC -0.15 mS/cm</span>
              </div>
            )}

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Safety Interlocks:</span>
              <span className={`font-bold flex items-center gap-1 ${eStopActive ? 'text-rose-400' : 'text-emerald-400'}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {eStopActive ? 'ESTOP VETO' : 'ALL 13 INVARIANTS PASS'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
