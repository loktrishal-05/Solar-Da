import React, { useState } from 'react';
import { calculateSubstrateRecipe, SubstrateRecipeResult } from '@terrasub-solarda/engine';
import { AlertOctagon, CheckCircle2, ShieldCheck, Beaker, Layers, Smartphone } from 'lucide-react';

export const SubstrateCalculator: React.FC = () => {
  const [targetVolumeLiters, setTargetVolumeLiters] = useState<number>(2.0);
  const [gelatinSource, setGelatinSource] = useState<'FISH' | 'POULTRY' | 'TANNERY' | 'OTHER'>('FISH');
  const [trialType, setTrialType] = useState<'CONTROL' | 'BENCHMARK' | 'FORMULA' | 'ISOLATION_NO_GELATIN'>('FORMULA');

  const recipe: SubstrateRecipeResult = calculateSubstrateRecipe({
    targetVolumeLiters,
    gelatinSource,
    trialType,
  });

  return (
    <div className="bg-[#090b10] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Beaker className="w-6 h-6 text-emerald-400" />
            <h2 className="font-display text-2xl font-extrabold text-white">Substrate Recipe & Gelatin Safety Calculator</h2>
          </div>
          <p className="text-xs text-slate-400">
            TerraSub Biodegradable Soil-Replacement Substrate — Scale batch, verify gelatin sourcing, & log trial recipes.
          </p>
        </div>
        <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800/40 text-xs font-bold rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Safety Validated Batch
        </span>
      </div>

      {/* Field Reference Photo Showcase (2L Substrate Calculator) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-950/80 p-5 rounded-2xl border border-white/10">
        <div className="md:col-span-4 flex justify-center">
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-[260px]">
            <img src="/media/8ad1f6dd-2cd4-42ed-ae21-0114beab7d80.jpg" alt="Substrate Calculator Device Mockup" className="w-full h-auto object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-emerald-400 bg-slate-950/80 backdrop-blur p-1 rounded border border-white/10 text-center">
              Field Device: 2L Substrate Batch Logged
            </span>
          </div>
        </div>

        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Smartphone className="w-4 h-4" />
            <span className="eyebrow-quiet text-emerald-400">GREENHOUSE BATCH LOGGING REFERENCE</span>
          </div>
          <h3 className="font-display text-lg font-bold text-white">2.0 Liter Reference Recipe Calculator</h3>
          <p className="text-xs text-slate-300 leading-relaxed font-light">
            Exact batch recipe computed for open horizontal grow pipes: Hydrated Coco Coir (1,100 ml), Vermicompost (500 ml), Rice Husk Biochar (200 ml), Neem Cake Powder (100 ml), Bone Meal (50 ml), Gelatin Solution (10 g).
          </p>
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs">
            <span className="font-bold block">Safety Mandate:</span> Use fish or poultry-derived gelatin only. Never tannery-derived solid waste.
          </div>
        </div>
      </div>

      {/* HARD GELATIN SAFETY WARNING BANNER */}
      {gelatinSource === 'TANNERY' && (
        <div className="bg-red-950/90 border-2 border-red-500 rounded-2xl p-5 text-red-200 space-y-2 animate-pulse shadow-lg">
          <div className="flex items-center space-x-2 font-bold text-red-100 text-sm">
            <AlertOctagon className="w-6 h-6 text-red-400 flex-shrink-0" />
            <span>CRITICAL SAFETY VIOLATION: Tannery Gelatin Prohibited</span>
          </div>
          <p className="text-xs leading-relaxed text-red-200">
            Tannery-derived gelatin/collagen is <strong>STRICTLY PROHIBITED</strong> due to extreme heavy metal contamination risk (Hexavalent Chromium Cr(VI)) documented in tannery solid waste (e.g. TN Vellore-Ranipet industrial belt). Only <strong>certified Fish or Poultry-derived gelatin</strong> is permitted.
          </p>
        </div>
      )}

      {/* Control Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-950/80 p-5 rounded-2xl border border-white/10">
        <div>
          <label className="eyebrow-quiet block mb-1.5">Target Batch Volume (Liters)</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={targetVolumeLiters}
              onChange={(e) => setTargetVolumeLiters(parseFloat(e.target.value) || 2.0)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="text-xs text-slate-400 font-semibold">L</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Baseline batch: 2.0 Liters</span>
        </div>

        <div>
          <label className="eyebrow-quiet block mb-1.5">Gelatin / Collagen Source</label>
          <select
            value={gelatinSource}
            onChange={(e) => setGelatinSource(e.target.value as any)}
            className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none ${
              gelatinSource === 'TANNERY' ? 'border-red-500 text-red-400 font-bold bg-red-950/40' : 'border-white/10 text-white'
            }`}
          >
            <option value="FISH">Fish Gelatin (Recommended - Safe)</option>
            <option value="POULTRY">Poultry Gelatin (Safe)</option>
            <option value="TANNERY">Tannery Solid Waste (PROHIBITED - Chromium Risk)</option>
            <option value="OTHER">Unverified Source</option>
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">Tamil Nadu Vellore-Ranipet safety rule</span>
        </div>

        <div>
          <label className="eyebrow-quiet block mb-1.5">Validation Trial Isolation Mode</label>
          <select
            value={trialType}
            onChange={(e) => setTrialType(e.target.value as any)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="FORMULA">Tray C — Full Formula (with Gelatin)</option>
            <option value="ISOLATION_NO_GELATIN">Tray D — Isolation (No Gelatin)</option>
            <option value="CONTROL">Tray A — Control (Coco Coir + Water Only)</option>
            <option value="BENCHMARK">Tray B — Benchmark (Commercial Cocopeat + NPK)</option>
          </select>
          <span className="text-[11px] text-slate-500 mt-1 block">10-14 day pre-hackathon Methi trial logger</span>
        </div>
      </div>

      {/* Calculated Ingredient Quantities Table */}
      <div className="space-y-3">
        <h3 className="font-display text-sm font-bold text-slate-200 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Calculated Batch Quantities ({targetVolumeLiters}L Batch)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Hydrated Coco Coir</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{recipe.ingredients.cocoCoirMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Structure & water retention</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Mature Vermicompost</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{recipe.ingredients.vermicompostMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Primary nutrients & microbes</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Rice Husk Biochar</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{recipe.ingredients.riceHuskBiocharMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Aeration & drainage</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Neem Cake Powder</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{recipe.ingredients.neemCakePowderMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Pest deterrent & slow N</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Bone Meal / Eggshell</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-1 block">{recipe.ingredients.boneMealMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Calcium & Phosphorus</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Fish/Poultry Gelatin</span>
            <span className="text-xl font-bold text-cyan-400 font-mono mt-1 block">{recipe.ingredients.gelatinGrams} g</span>
            <span className="text-[10px] text-slate-500 block mt-1">Nitrogen boost & binder</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Cold Water Bloom</span>
            <span className="text-xl font-bold text-cyan-400 font-mono mt-1 block">{recipe.ingredients.coldWaterMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Bloom gelatin 5 mins</span>
          </div>
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-white/10 text-center">
            <span className="eyebrow-quiet block text-[10px]">Warm Water Dissolve</span>
            <span className="text-xl font-bold text-cyan-400 font-mono mt-1 block">{recipe.ingredients.warmWaterMl} ml</span>
            <span className="text-[10px] text-slate-500 block mt-1">Max 70°C (do not boil)</span>
          </div>
        </div>
      </div>

      {/* Prep Sequence Checklist */}
      <div className="bg-slate-950/80 p-5 rounded-2xl border border-white/10 space-y-3">
        <h3 className="eyebrow-quiet flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Batch Preparation Sequence</span>
        </h3>
        <ol className="space-y-2">
          {recipe.prepSequence.map((step, idx) => (
            <li key={idx} className="flex items-start space-x-3 text-xs text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-900 border border-white/10 text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                {idx + 1}
              </span>
              <span className="mt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};
