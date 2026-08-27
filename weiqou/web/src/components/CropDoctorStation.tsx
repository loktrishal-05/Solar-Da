import React, { useState } from 'react';
import { Camera, UploadCloud, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, FileText, Filter, RotateCcw } from 'lucide-react';

interface CropDoctorStationProps {
  onCreateTreatmentProposal: (protocolName: string) => void;
}

export const CropDoctorStation: React.FC<CropDoctorStationProps> = ({ onCreateTreatmentProposal }) => {
  const [selectedImage, setSelectedImage] = useState<string>('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(0.82); // 82% confidence -> high confidence!
  const [activeLayer, setActiveLayer] = useState<'ALL' | 'DISEASE' | 'DEFICIENCY' | 'HEALTHY'>('ALL');

  const handleSimulateScan = (imgUrl: string, confVal: number) => {
    setSelectedImage(imgUrl);
    setConfidence(confVal);
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1600);
  };

  return (
    <section id="crop-doctor-station" className="bg-white py-12 px-4 lg:px-6 border-b border-gray-200 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Foliage Vision Workstation</span>
            <h2 className="text-2xl font-extrabold text-[#1A1A1A]">Crop Doctor — Interactive Diagnostics Station</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="px-3 py-1 bg-[#E8F5E9] text-[#1B4332] border border-[#A5D6A7] font-bold rounded-full">
              Model Stack: YOLOv11-CEA-v2.3 + EfficientNetV3-B3
            </span>
          </div>
        </div>

        {/* 50/50 Split Screen Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANEL — IMAGE CAPTURE & ANALYSIS */}
          <div className="lg:col-span-6 bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            {/* Upload Zone Drop Area */}
            <div className="bg-white p-6 rounded-xl border-2 border-dashed border-[#7CB342] text-center space-y-3 hover:border-[#1B4332] transition">
              <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#1B4332] flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6 text-[#7CB342]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-900">Drag leaf image or click to capture from camera</h3>
                <p className="text-[11px] text-gray-500 font-mono">Supports JPG, PNG (YOLOv11 640×640 tensor input)</p>
              </div>

              <div className="flex justify-center space-x-2 pt-1">
                <button
                  onClick={() => handleSimulateScan('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.82)}
                  className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-full shadow-sm transition"
                >
                  Scan Reference Sample
                </button>
                <button
                  onClick={() => handleSimulateScan('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.62)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-full border border-gray-300 transition"
                >
                  Simulate Low Conf (&lt;75%)
                </button>
              </div>
            </div>

            {/* Photo Preview Viewer with Animated Scanline Sweep */}
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col items-center">
              <div className="relative rounded-lg overflow-hidden max-w-[400px] w-full border border-gray-200">
                <img src={selectedImage} alt="Crop Diagnostic Scan" className="w-full h-auto object-cover" />

                {/* Animated Horizontal Scanline */}
                {isScanning && (
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7CB342] to-transparent animate-scanline shadow-lg" />
                )}

                {/* YOLOv11 Interactive Bounding Boxes */}
                {!isScanning && (activeLayer === 'ALL' || activeLayer === 'DISEASE') && (
                  <div className="absolute top-[28%] left-[22%] w-[42%] h-[34%] border-2 border-red-600 rounded bg-red-600/10 p-1 group cursor-pointer">
                    <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Early Leaf Spot (82% | [x:142, y:180])
                    </span>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="mt-3 text-center text-xs font-bold text-[#1B4332] animate-pulse flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#7CB342]" />
                  <span>YOLOv11 detecting lesions... → EfficientNetV3 classifying...</span>
                </div>
              )}

              {/* Layer Filter Pills */}
              {!isScanning && (
                <div className="flex items-center space-x-1.5 mt-3 text-[10px] font-mono">
                  <span className="text-gray-500 font-sans font-semibold">Bounding Layers:</span>
                  {['ALL', 'DISEASE', 'DEFICIENCY', 'HEALTHY'].map((layer) => (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer as any)}
                      className={`px-2 py-0.5 rounded font-bold transition ${
                        activeLayer === layer ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — DIAGNOSIS REPORT */}
          <div className="lg:col-span-6 bg-[#FAFAF8] p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            {/* Top Bar: Confidence Gauge */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-200" strokeWidth="3.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                      className={confidence >= 0.75 ? 'text-[#059669]' : 'text-[#D97706]'}
                      strokeDasharray={`${(confidence * 100).toFixed(0)}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-bold text-xs text-gray-900">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Diagnostic Confidence Score</h3>
                  <span className="text-[10px] text-gray-500 font-mono block">Safety Gate Threshold: 75%</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full font-mono text-xs font-bold ${confidence >= 0.75 ? 'bg-emerald-50 text-[#059669] border border-emerald-200' : 'bg-amber-50 text-[#D97706] border border-amber-200'}`}>
                {confidence >= 0.75 ? 'VALIDATED (>75%)' : 'LOW CONFIDENCE (<75%)'}
              </span>
            </div>

            {/* ABSTENTION BANNER vs FULL TREATMENT PROTOCOL */}
            {confidence < 0.75 ? (
              <div className="bg-[#FFF8E1] border-2 border-[#D97706] rounded-xl p-5 space-y-4 text-xs">
                <div className="flex items-start space-x-2 text-[#D97706] font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block">ABSTENTION MANDATE: Low Confidence Diagnosis</span>
                    <span className="text-xs text-[#8D6E63] font-normal block mt-1">
                      Model confidence ({(confidence * 100).toFixed(0)}%) is below the mandatory 75% safety threshold. Platform abstains from generating chemical cure protocols and escalates to human agronomist review.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-gray-700 space-y-1 font-mono text-[11px]">
                  <span className="font-bold text-gray-900 font-sans block">Guidance for Retake:</span>
                  <div>• Image lighting too dim — increase artificial PAR light</div>
                  <div>• Focus distance: Keep lens 15-20cm from affected canopy</div>
                </div>

                <div className="flex space-x-3 pt-1">
                  <button className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-full shadow transition text-center">
                    Request Expert Review
                  </button>
                  <button
                    onClick={() => handleSimulateScan('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.82)}
                    className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold rounded-full transition text-center"
                  >
                    Retake Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-[#1B4332] text-sm flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-[#7CB342]" />
                      <span>Early Leaf Spot (Cercospora fenugreek)</span>
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono block">Classified by EfficientNetV3-B3 (Top-1)</span>
                  </div>
                </div>

                <div className="space-y-2 text-gray-700">
                  <span className="font-bold text-gray-900 block font-mono text-[11px] uppercase">Explanation & Cross-Check:</span>
                  <p className="leading-relaxed text-gray-600 font-normal">
                    Circular brown lesions with chlorotic yellow halos detected on lower canopy leaves. Substrate EC history (1.55 mS/cm) and pH (6.2) remain within acceptable bounds for Methi.
                  </p>
                </div>

                {/* Sourced Corrective Steps */}
                <div className="space-y-2 bg-[#FAFAF8] p-3.5 rounded-xl border border-gray-200">
                  <span className="font-bold text-gray-900 block font-mono text-[11px] uppercase">Sourced Treatment Protocol (KB v3.2):</span>
                  <ol className="space-y-1.5 text-gray-700 leading-relaxed font-mono text-[11px]">
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-[#1B4332]">1.</span>
                      <span>Apply Neem Oil Spray (2ml / 1L water) to lower canopy.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-[#1B4332]">2.</span>
                      <span>Increase ventilation fan duty cycle to reduce relative humidity.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="font-bold text-[#1B4332]">3.</span>
                      <span>Withdrawal Harvest Block: 3 Days (Clear before listing).</span>
                    </li>
                  </ol>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => onCreateTreatmentProposal('Neem Oil Spray Protocol')}
                    className="flex-1 py-2.5 bg-[#1B4332] hover:bg-[#143326] text-white font-bold rounded-full shadow-sm transition text-center"
                  >
                    CREATE TREATMENT PROPOSAL
                  </button>
                  <button className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-full border border-gray-300 transition">
                    Log to Batch
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Horizontal Scroll: Recent Scans */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">Recent Diagnostic Scans Log</h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-3 min-w-[240px]">
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img src="/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg" alt="Scan" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs font-mono">
                  <span className="font-bold text-gray-900 block">Scan #{i} — G-04</span>
                  <span className="text-[#059669] font-bold text-[10px] block">Early Leaf Spot (82%)</span>
                  <span className="text-gray-400 text-[9px] block">14:32 Today</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
