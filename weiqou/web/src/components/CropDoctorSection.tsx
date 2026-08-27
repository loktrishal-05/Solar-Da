import React, { useState } from 'react';
import { Camera, UploadCloud, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';

export const CropDoctorSection: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string>('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(0.82); // 82% confidence -> triggers protocol!
  const [qualityScore, setQualityScore] = useState<number>(0.92);

  const handleRunScan = (imgUrl: string, conf: number, qual: number) => {
    setSelectedImage(imgUrl);
    setConfidence(conf);
    setQualityScore(qual);
    setIsScanning(true);
    setTimeout(() => setIsScanning(false), 1500);
  };

  return (
    <section id="crop-doctor" className="relative py-20 px-4 lg:px-8 bg-white border-t border-gray-200">
      {/* Background Video #4 with 88% White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/yrdr.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover bg-video-desaturated opacity-25"
        />
        <div className="absolute inset-0 bg-white/88" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7CB342]">Computer Vision Diagnostics</span>
            <h2 className="text-3xl font-extrabold text-[#1A1A1A]">AI Crop Doctor (YOLOv11 + EfficientNetV3)</h2>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 bg-[#E8F5E9] text-[#2D5A3D] border border-[#A5D6A7] text-xs font-bold rounded-full font-mono">
              Models: YOLOv11-Nano & EfficientNetV3
            </span>
          </div>
        </div>

        {/* Upload Zone & Scan Presets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Dashed Border #7CB342 Upload Zone */}
          <div className="md:col-span-5 bg-[#FAFAF8] p-8 rounded-2xl border-2 border-dashed border-[#7CB342] text-center space-y-4 hover:border-[#2D5A3D] transition">
            <div className="w-14 h-14 rounded-full bg-[#E8F5E9] text-[#2D5A3D] flex items-center justify-center mx-auto">
              <UploadCloud className="w-7 h-7 text-[#7CB342]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Upload or Capture Foliage Scan</h3>
              <p className="text-xs text-gray-500 mt-1">Drag & drop photo or capture via farmer device camera</p>
            </div>

            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => handleRunScan('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.82, 0.95)}
                className="px-4 py-2 bg-[#2D5A3D] hover:bg-[#234730] text-white text-xs font-bold rounded-full shadow transition"
              >
                Scan Reference Photo
              </button>
              <button
                onClick={() => handleRunScan('/media/7f83a38e-e74d-4d9a-86be-5f14cb27baba.jpg', 0.65, 0.45)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-full border border-gray-300 transition"
              >
                Simulate Low Conf (Abstain)
              </button>
            </div>
          </div>

          {/* Real Photo Viewer with Bounding Box & Scanline */}
          <div className="md:col-span-7 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col items-center">
            <div className="relative rounded-xl overflow-hidden max-w-[420px] w-full border border-gray-200">
              <img src={selectedImage} alt="Crop Scan" className="w-full h-auto object-cover" />

              {/* Animated Horizontal Laser Scanline */}
              {isScanning && (
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7CB342] to-transparent animate-scanline shadow-lg" />
              )}

              {/* YOLOv11 Simulated Bounding Boxes */}
              {!isScanning && (
                <div className="absolute top-[25%] left-[20%] w-[45%] h-[35%] border-2 border-red-500 rounded bg-red-500/10 flex items-start p-1">
                  <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                    Early Leaf Spot (YOLOv11: 82%)
                  </span>
                </div>
              )}
            </div>

            {isScanning && (
              <div className="mt-3 text-center text-xs font-bold text-[#2D5A3D] animate-pulse flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing image with YOLOv11 & EfficientNetV3...</span>
              </div>
            )}
          </div>
        </div>

        {/* Quality Gate Warning */}
        {qualityScore < 0.50 && (
          <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl p-4 flex items-start space-x-3 text-xs text-[#8D6E63]">
            <AlertTriangle className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-[#5D4037] block">Quality Gate Warning: Photo Blurry / Improper Light</span>
              <span>Image quality score is low ({(qualityScore * 100).toFixed(0)}%). Please retake photo with clear focus on foliage.</span>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {!isScanning && (
          <div className="bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* YOLOv11 Detections & EfficientNet Top-3 Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">EfficientNetV3 Top-3 Predictions</span>
                  <span className="font-mono text-xs font-bold text-[#2D5A3D]">{(confidence * 100).toFixed(0)}% Match</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold text-gray-800 mb-1">
                      <span>1. Early Leaf Spot (Cercospora)</span>
                      <span className="font-mono text-[#059669]">82.4%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-[#059669] h-2 rounded-full" style={{ width: '82.4%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-gray-700 mb-1">
                      <span>2. Powdery Mildew</span>
                      <span className="font-mono text-gray-500">12.1%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: '12.1%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-gray-700 mb-1">
                      <span>3. Nitrogen Deficiency</span>
                      <span className="font-mono text-gray-500">5.5%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-gray-400 h-2 rounded-full" style={{ width: '5.5%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ABSTENTION LOGIC vs TREATMENT PROTOCOL CARD */}
              {confidence < 0.75 ? (
                /* Abstention Message */
                <div className="bg-[#FFF8E1] border-2 border-[#D97706] rounded-xl p-6 flex flex-col justify-between text-xs space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-[#D97706] font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <span>ABSTENTION: Low Confidence Prediction</span>
                    </div>
                    <p className="text-[#8D6E63] leading-relaxed">
                      Model confidence ({(confidence * 100).toFixed(0)}%) is below mandatory safety threshold (75%). The platform abstains from auto-generating a chemical cure protocol and escalates to human agronomist review.
                    </p>
                  </div>
                  <button className="py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold rounded-full shadow transition text-center">
                    Escalate Case to Agronomist
                  </button>
                </div>
              ) : (
                /* Sourced Treatment Protocol Card */
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h4 className="font-bold text-[#2D5A3D] text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#7CB342]" />
                      <span>Treatment Protocol (Sourced KB v3.2)</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#059669] font-bold font-mono text-[10px]">
                      Confidence &gt; 75% Validated
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-gray-900 block">Corrective Steps:</span>
                    <ol className="space-y-1.5 text-gray-700 leading-relaxed font-normal">
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-[#2D5A3D] font-mono">1.</span>
                        <span>Apply Neem Oil Solution (2ml/L water) via spray applicator.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-[#2D5A3D] font-mono">2.</span>
                        <span>Improve canopy airflow by increasing ventilation fan duty cycle.</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="font-bold text-[#2D5A3D] font-mono">3.</span>
                        <span>Verify substrate EC (1.55 mS/cm) and pH (6.2) setpoints.</span>
                      </li>
                    </ol>
                  </div>

                  <div className="p-3 bg-[#FAFAF8] rounded-xl border border-gray-200 font-mono text-[11px] text-gray-600 flex justify-between items-center">
                    <span>Withdrawal Harvest Block:</span>
                    <span className="font-bold text-[#D97706]">3 Days (Clear before listing)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
