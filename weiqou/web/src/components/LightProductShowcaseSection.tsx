import React from 'react';
import { Layers, Cpu, Droplets, Zap, Activity, ShieldCheck } from 'lucide-react';

export const LightProductShowcaseSection: React.FC = () => {
  return (
    <section className="bg-white py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342] font-mono">Product Architecture</span>
          <h2 className="text-3xl font-extrabold text-[#1A1A1A]">Two Dedicated Modes, One Shared Platform Engine</h2>
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            Whether running horizontal substrate replacement units or vertical tower hydroponic CEA systems, safety interlocks and contract invariants remain identical.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SIDE 1: TERRASUB MVP (Video #2 Background) */}
          <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] shadow-lg p-8 space-y-6 bg-[#FAFAF8]">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <video
                src="/media/STYLE_BIBLE_ABOVE___Using_the (1).mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover filter saturate-[0.8] opacity-15"
              />
              <div className="absolute inset-0 bg-[#FAFAF8]/85" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold shadow">
                  <Layers className="w-5 h-5 text-[#7CB342]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-[#1A1A1A]">TerraSub MVP</h3>
                  <span className="text-xs text-gray-500 font-mono">Biodegradable Substrate & Pulse Irrigation</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-[10px] font-sans block">Substrate Moisture</span>
                  <span className="font-black text-[#1B4332] text-lg block">28.5%</span>
                  <span className="text-[9px] text-[#059669] block">Target: 35.0%</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-[10px] font-sans block">Pulse Duration</span>
                  <span className="font-black text-[#1B4332] text-lg block">12 sec</span>
                  <span className="text-[9px] text-gray-500 block">~250ml water</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-[10px] font-sans block">Cooldown Lock</span>
                  <span className="font-black text-[#1B4332] text-lg block">30 min</span>
                  <span className="text-[9px] text-[#059669] block">Timer Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE 2: SOLAR-DA V3 (Video #3 Background) */}
          <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] shadow-lg p-8 space-y-6 bg-[#FAFAF8]">
            <div className="absolute inset-0 z-0 overflow-hidden">
              <video
                src="/media/STYLE_BIBLE_ABOVE___Using_the (2).mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover filter saturate-[0.8] opacity-15"
              />
              <div className="absolute inset-0 bg-[#FAFAF8]/85" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center font-bold shadow">
                  <Cpu className="w-5 h-5 text-[#7CB342]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-[#1A1A1A]">Solar-Da v3</h3>
                  <span className="text-xs text-gray-500 font-mono">Vertical Tower CEA & Solar Power Scheduler</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-[10px] font-sans block">Tower Flow Rate</span>
                  <span className="font-black text-[#1B4332] text-lg block">4.2 L/m</span>
                  <span className="text-[9px] text-[#059669] block">Normal Flow</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-[10px] font-sans block">EC Proxy</span>
                  <span className="font-black text-[#1B4332] text-lg block">1.80</span>
                  <span className="text-[9px] text-gray-500 block">mS/cm</span>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm space-y-1">
                  <span className="text-gray-500 text-[10px] font-sans block">Solar Battery</span>
                  <span className="font-black text-[#059669] text-lg block">94% SOC</span>
                  <span className="text-[9px] text-[#059669] block">Peak Solar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
