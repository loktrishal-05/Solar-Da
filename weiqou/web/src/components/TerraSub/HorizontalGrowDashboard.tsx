import React, { useState } from 'react';
import { Droplets, Zap, Thermometer, Wind, AlertCircle, Play, CheckCircle, Smartphone } from 'lucide-react';

interface HorizontalGrowDashboardProps {
  onTriggerPulse: (unitId: string, durationSec: number) => void;
}

export const HorizontalGrowDashboard: React.FC<HorizontalGrowDashboardProps> = ({ onTriggerPulse }) => {
  const [moisture] = useState<number>(28.5); // Below threshold 35%
  const [ec] = useState<number>(1.55);
  const [ph] = useState<number>(6.2);
  const [temp] = useState<number>(27.5);
  const [rh] = useState<number>(62.0);
  const [pulseDuration, setPulseDuration] = useState<number>(15);
  const [pulseTriggered, setPulseTriggered] = useState<boolean>(false);

  const moistureThresholdLow = 35.0;
  const isPulseNeeded = moisture < moistureThresholdLow;

  const handleManualPulse = () => {
    onTriggerPulse('gu_horizontal_01', pulseDuration);
    setPulseTriggered(true);
    setTimeout(() => setPulseTriggered(false), 3000);
  };

  return (
    <div className="bg-[#090b10] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Droplets className="w-6 h-6 text-cyan-400" />
            <h2 className="font-display text-2xl font-extrabold text-white">TerraSub Horizontal Grow Unit Telemetry</h2>
          </div>
          <p className="text-xs text-slate-400">
            Gutter 1 — Methi Fenugreek (Biodegradable Substrate + Moisture-Pulse Irrigation)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono text-emerald-300">ESP32 Device Online</span>
        </div>
      </div>

      {/* Field Device Reference Showcase (Irrigation Pulse Pop-up Mockup) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-950/80 p-5 rounded-2xl border border-white/10">
        <div className="md:col-span-4 flex justify-center">
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-[260px]">
            <img src="/media/a7e67a16-b33a-46dc-ae20-f3c976c4d8b1.jpg" alt="Irrigation Event Mockup" className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-cyan-300 bg-slate-950/80 backdrop-blur p-1 rounded border border-white/10 text-center">
              Auto Pulse Event: 10:48 AM (12s duration)
            </span>
          </div>
        </div>

        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Smartphone className="w-4 h-4" />
            <span className="eyebrow-quiet text-cyan-400">AUTOMATED MOISTURE-PULSE EVENT REFERENCE</span>
          </div>
          <h3 className="font-display text-lg font-bold text-white">Threshold-Triggered Irrigation Pulse (12s Pulse)</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            When moisture falls below 35%, the ESP32 microcontroller triggers a targeted 12-second pulse irrigation event and logs an immutable audit row.
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-white/10 text-xs text-slate-300 font-mono">
            Pulse Rule: Moisture &lt; 35.0% → Trigger Relay 15s → Cooldown 30m
          </div>
        </div>
      </div>

      {/* SENSOR HONESTY RULE MANDATE (§3.5) */}
      <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-4 flex items-start space-x-3 text-amber-200 text-xs">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-100 block">Sensor Honesty Rule (Platform Mandate)</span>
          <span>
            Conductive NPK probes in complex organic substrates are uncalibrated and unreliable. All substrate EC readings are presented strictly as <strong>total salt trend proxies</strong>, validated against lab baselines, never as raw ionic NPK values.
          </span>
        </div>
      </div>

      {/* Live Sensor Telemetry Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className={`p-4 rounded-2xl border ${isPulseNeeded ? 'bg-cyan-950/40 border-cyan-500' : 'bg-slate-950/80 border-white/10'} text-center space-y-1`}>
          <span className="eyebrow-quiet block text-[10px] flex items-center justify-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" /> Soil Moisture
          </span>
          <span className="font-display text-3xl font-black text-cyan-300">{moisture}%</span>
          <span className="text-[10px] text-cyan-400 block font-semibold font-mono">Below Threshold (35%)</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <span className="eyebrow-quiet block text-[10px] flex items-center justify-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> EC Trend Proxy
          </span>
          <span className="font-display text-3xl font-black text-yellow-300">{ec} mS/cm</span>
          <span className="text-[10px] text-slate-500 block font-mono">Target: 1.6 mS/cm</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <span className="eyebrow-quiet block text-[10px]">Substrate pH</span>
          <span className="font-display text-3xl font-black text-emerald-300">{ph}</span>
          <span className="text-[10px] text-slate-500 block font-mono">Window [5.8, 6.8]</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <span className="eyebrow-quiet block text-[10px] flex items-center justify-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" /> Ambient Temp
          </span>
          <span className="font-display text-3xl font-black text-rose-300">{temp}°C</span>
          <span className="text-[10px] text-slate-500 block font-mono">DHT22 Sensor</span>
        </div>

        <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center space-y-1">
          <span className="eyebrow-quiet block text-[10px] flex items-center justify-center gap-1">
            <Wind className="w-3.5 h-3.5 text-blue-400" /> Humidity
          </span>
          <span className="font-display text-3xl font-black text-blue-300">{rh}%</span>
          <span className="text-[10px] text-slate-500 block font-mono">VPD: 1.05 kPa</span>
        </div>
      </div>

      {/* Moisture Pulse Control Button */}
      <div className="bg-slate-950/90 p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="font-display text-sm font-bold text-white flex items-center space-x-2">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Moisture-Pulse Irrigation Controller</span>
          </h3>
          <p className="text-xs text-slate-400 font-light">
            Solid organic media holds moisture. Controller fires short pulse triggers, not continuous recirculating flow.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-300 font-semibold font-mono">Pulse:</span>
            <input
              type="number"
              value={pulseDuration}
              onChange={(e) => setPulseDuration(parseInt(e.target.value) || 15)}
              className="w-16 bg-slate-900 border border-white/10 rounded-xl px-2 py-1 text-xs text-center text-white font-mono"
            />
            <span className="text-xs text-slate-400 font-mono">sec</span>
          </div>

          <button
            onClick={handleManualPulse}
            disabled={pulseTriggered}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold transition shadow-lg ${
              pulseTriggered
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white'
            }`}
          >
            {pulseTriggered ? <CheckCircle className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{pulseTriggered ? 'Proposal Created' : 'Propose Pulse'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
