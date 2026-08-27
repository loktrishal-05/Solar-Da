import React, { useState } from 'react';
import { Camera, UploadCloud, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, FileText, Layers } from 'lucide-react';

interface DarkCropDoctorTabProps {
  onCreateProposal: (protocolName: string) => void;
}

export const DarkCropDoctorTab: React.FC<DarkCropDoctorTabProps> = ({ onCreateProposal }) => {
  const [selectedView, setSelectedView] = useState<'CANOPY' | 'ROOTS'>('CANOPY');
  const [selectedImage, setSelectedImage] = useState<string>('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(0.82); // 82% confidence -> validated!

  const handleScanSample = (imgUrl: string, confVal: number) => {
    setSelectedImage(imgUrl);
    setConfidence(confVal);
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1600);
  };

  return (
    <div className="relative space-y-8 text-slate-100 font-sans">
      {/* Video Background #3 — Darkened Root/Foliage Footage */}
      <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
        <video
          src="/media/yrdr.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter brightness-[0.25] opacity-25"
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/90" />
      </div>

      <div className="relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Camera className="w-6 h-6 text-teal-400" />
              <h2 className="font-display text-2xl font-extrabold text-white">Root Net-Port & Canopy Diagnostics</h2>
            </div>
            <p className="text-xs text-slate-400 font-light">
              YOLOv11 lesion detection + EfficientNetV3 classification with mandatory 75% abstention gate.
            </p>
          </div>

          {/* Root Net-Port View vs Canopy View Toggle */}
          <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-full border border-white/10 text-xs font-mono">
            <button
              onClick={() => setSelectedView('CANOPY')}
              className={`px-4 py-1.5 rounded-full font-bold transition ${
                selectedView === 'CANOPY' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Canopy View
            </button>
            <button
              onClick={() => setSelectedView('ROOTS')}
              className={`px-4 py-1.5 rounded-full font-bold transition ${
                selectedView === 'ROOTS' ? 'bg-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Root Net-Port View
            </button>
          </div>
        </div>

        {/* 50/50 Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: UPLOAD ZONE & PHOTO VIEWER WITH LASER SCANLINE */}
          <div className="lg:col-span-6 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
            {/* Upload Drop Zone */}
            <div className="bg-slate-950/60 p-6 rounded-2xl border-2 border-dashed border-teal-500/40 text-center space-y-3 hover:border-teal-400 transition">
              <div className="w-12 h-12 rounded-full bg-teal-950/80 text-teal-400 flex items-center justify-center mx-auto border border-teal-500/30">
                <UploadCloud className="w-6 h-6 text-teal-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-white">Drop leaf/root image or click to scan</h3>
                <p className="text-[11px] text-slate-400 font-mono">YOLOv11 640×640 tensor model pipeline</p>
              </div>

              <div className="flex justify-center space-x-2 pt-1">
                <button
                  onClick={() => handleScanSample('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.82)}
                  className="px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 text-xs font-extrabold rounded-full shadow-lg transition"
                >
                  Scan Reference Sample
                </button>
                <button
                  onClick={() => handleScanSample('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.62)}
                  className="px-4 py-1.5 bg-white/10 text-white text-xs font-bold rounded-full border border-white/10 hover:bg-white/20 transition"
                >
                  Simulate Low Conf (&lt;75%)
                </button>
              </div>
            </div>

            {/* Photo Viewer with Bounding Box & Laser Sweep Line */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="relative rounded-xl overflow-hidden max-w-[400px] w-full border border-white/10">
                <img src={selectedImage} alt="Crop Scan" className="w-full h-auto object-cover" />

                {/* Animated Scanline Sweep */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-scanline shadow-lg shadow-teal-500/50" />
                )}

                {/* YOLOv11 Bounding Boxes Overlay */}
                {!isScanning && (
                  <div className="absolute top-[28%] left-[22%] w-[42%] h-[34%] border-2 border-red-500 rounded bg-red-500/10 p-1">
                    <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Early Leaf Spot (82%)
                    </span>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="mt-3 text-center text-xs font-bold text-teal-300 animate-pulse flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-teal-400" />
                  <span>YOLOv11 detecting lesions... → EfficientNetV3 classifying...</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: DIAGNOSIS REPORT (Dark Glass Card) */}
          <div className="lg:col-span-6 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Confidence Circular Gauge Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-800" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                      className={confidence >= 0.75 ? 'text-teal-400' : 'text-amber-400'}
                      strokeDasharray={`${(confidence * 100).toFixed(0)}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-bold text-xs text-white">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Diagnostic Confidence Score</h3>
                  <span className="text-[10px] text-slate-400 font-mono block">Safety Gate Ceiling: 75%</span>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${confidence >= 0.75 ? 'bg-teal-950 text-teal-300 border border-teal-500/40' : 'bg-amber-950 text-amber-300 border border-amber-500/40'}`}>
                {confidence >= 0.75 ? 'VALIDATED (>75%)' : 'ABSTENTION (<75%)'}
              </span>
            </div>

            {/* ABSTENTION BANNER vs TREATMENT PROTOCOL */}
            {confidence < 0.75 ? (
              <div className="bg-amber-950/60 border-2 border-amber-500/50 rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-start space-x-2 text-amber-200 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block">ABSTENTION BANNER: Low Confidence Prediction</span>
                    <span className="text-xs text-amber-300 font-normal block mt-1 leading-relaxed">
                      Model confidence ({(confidence * 100).toFixed(0)}%) is below the mandatory 75% threshold. Platform abstains from generating chemical protocols and escalates to agronomist review.
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-full shadow transition">
                    Request Agronomist Review
                  </button>
                  <button
                    onClick={() => handleScanSample('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.82)}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/10 transition"
                  >
                    Retake Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <div>
                    <h4 className="font-bold text-teal-300 text-sm flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-teal-400" />
                      <span>Early Leaf Spot (Cercospora fenugreek)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono block">Model: EfficientNetV3-B3 (Top-1)</span>
                  </div>
                </div>

                <div className="space-y-2 text-slate-300 font-light">
                  <span className="font-bold text-white block font-mono text-[11px] uppercase">Explanation:</span>
                  <p className="leading-relaxed text-slate-400">
                    Circular brown lesions with chlorotic yellow halos detected on lower canopy leaves. Substrate EC history (1.55 mS/cm) and pH (6.2) remain within acceptable bounds.
                  </p>
                </div>

                {/* Sourced Corrective Steps */}
                <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-white/5 font-mono text-[11px]">
                  <span className="font-bold text-white block font-sans uppercase">Sourced Treatment Protocol (KB v3.2):</span>
                  <ol className="space-y-1 text-slate-300 leading-relaxed">
                    <li>1. Apply Neem Oil Spray (2ml / 1L water) to lower canopy.</li>
                    <li>2. Increase ventilation fan duty cycle to lower humidity.</li>
                    <li>3. Withdrawal Harvest Block: 3 Days (Clear before listing).</li>
                  </ol>
                </div>

                <button
                  onClick={() => onCreateProposal('Neem Oil Spray Protocol')}
                  className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-full shadow-lg shadow-teal-500/20 transition"
                >
                  CREATE TREATMENT PROPOSAL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Recent Scans Scroll */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Recent Diagnostic Scans Log</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/[0.03] backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center space-x-3 min-w-[240px]">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                  <img src="/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg" alt="Scan" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs font-mono">
                  <span className="font-bold text-white block">Scan #{i} — G-04</span>
                  <span className="text-teal-400 font-bold text-[10px] block">Early Leaf Spot (82%)</span>
                  <span className="text-slate-400 text-[9px] block">14:32 Today</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
