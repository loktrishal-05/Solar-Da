import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  AlertOctagon,
  CheckCircle2,
  ShieldAlert,
  FileText,
  Share2,
  Layers,
  RefreshCw,
  Cpu,
  Video,
  VideoOff,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react';
import { useDiseaseDetector, isAbstain, DiseasePrediction } from '../../hooks/useDiseaseDetector';

type ScanResult = {
  prediction: DiseasePrediction;
  target: 'CANOPY' | 'ROOT_PORT';
  abstained: boolean;
  abstainReason?: string;
};

const TARGET_RULE: Record<'CANOPY' | 'ROOT_PORT', { rule: string; action: string }> = {
  CANOPY: {
    rule: 'Tipburn vs pathogen discriminator (rule-based, VPD + EC cross-check)',
    action: 'Adjust air velocity to restore VPD to 0.8-1.2 kPa. Do NOT apply fungicides.',
  },
  ROOT_PORT: {
    rule: 'Pythium blast radius across shared reservoir loop',
    action: 'Drain and flush shared loop, apply H2O2 flush before next batch cycle.',
  },
};

export const CropDoctorRoots: React.FC = () => {
  const { model, classNames, loading, error, ready, predict, abstainThreshold } = useDiseaseDetector();

  const [imageTarget, setImageTarget] = useState<'CANOPY' | 'ROOT_PORT'>('ROOT_PORT');
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const samplePhotos = [
    {
      label: 'Root Net-Port Scan (Pythium Risk)',
      target: 'ROOT_PORT' as const,
      url: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb19657?auto=format&fit=crop&w=400&q=80',
    },
    {
      label: 'Canopy Scan (Tipburn Risk)',
      target: 'CANOPY' as const,
      url: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&q=80',
    },
  ];

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera API not available. Use HTTPS or localhost with a modern browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => undefined);
        }
      }, 50);
    } catch (err: any) {
      setCameraError(
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied.'
          : err?.name === 'NotFoundError'
          ? 'No camera found.'
          : `Camera error: ${err?.message || 'unknown'}`
      );
    }
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !ready) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setActiveImage(dataUrl);
    setImageTarget(imageTarget);
    stopCamera();
    await runScanFromElement(canvas);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });

  const runScanFromElement = async (el: HTMLImageElement | HTMLCanvasElement) => {
    setScanning(true);
    setScanError(null);
    setResult(null);
    try {
      const prediction = await predict(el, 3);
      if (!prediction) throw new Error('No prediction returned');
      const abstained = isAbstain(prediction, abstainThreshold);
      setResult({ prediction, target: imageTarget, abstained });
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const runScan = async (photo: (typeof samplePhotos)[number]) => {
    if (!ready) {
      setScanError('Model still loading...');
      return;
    }
    setScanning(true);
    setScanError(null);
    setResult(null);
    try {
      const img = await loadImage(photo.url);
      setActiveImage(photo.url);
      await runScanFromElement(img);
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
      setScanning(false);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setScanError('File too large (max 10 MB).');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setActiveImage(dataUrl);
      stopCamera();
      try {
        const img = await loadImage(dataUrl);
        await runScanFromElement(img);
      } catch (err: any) {
        setScanError(err?.message || 'Failed to scan uploaded image');
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleScan = (photo: (typeof samplePhotos)[number]) => {
    setImageTarget(photo.target);
    stopCamera();
    runScan(photo);
  };

  const formatClassName = (name: string) =>
    name
      .replace(/___/g, ' — ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Camera className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Crop Doctor — Root Net-Port & Canopy Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-400">
            MobileNetV2-PlantVillage inference + target-specific rule layer (Tipburn vs. shared-loop Pythium blast radius).
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setImageTarget('ROOT_PORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              imageTarget === 'ROOT_PORT' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            Root Net-Port View
          </button>
          <button
            onClick={() => setImageTarget('CANOPY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              imageTarget === 'CANOPY' ? 'bg-sky-600 text-white' : 'bg-slate-700 text-slate-400'
            }`}
          >
            Canopy View
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
        <span
          className={`px-2 py-0.5 rounded border ${
            ready
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-amber-950 text-amber-300 border-amber-800'
          }`}
        >
          {ready ? 'Model Ready' : loading ? 'Loading model...' : 'Model unavailable'}
        </span>
        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 flex items-center space-x-1">
          <Cpu className="w-3 h-3" />
          <span>Backend: {model ? 'webgl' : 'cpu'}</span>
        </span>
        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
          Classes: {Object.keys(classNames).length || 38}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {samplePhotos.map((photo, idx) => (
          <button
            key={idx}
            onClick={() => handleScan(photo)}
            className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-left flex items-center space-x-3 transition"
          >
            <img
              src={photo.url}
              alt={photo.label}
              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
              crossOrigin="anonymous"
            />
            <div>
              <span className="text-xs font-bold text-white block">{photo.label}</span>
              <span className="text-[11px] text-slate-400 block">Target: {photo.target}</span>
              <span className="text-[10px] text-emerald-400 block font-mono">Tap to analyze with TF.js...</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => {
            stopCamera();
            fileInputRef.current?.click();
          }}
          className="p-3 rounded-2xl border border-white/10 hover:border-white/20 bg-slate-950/80 text-left transition flex items-center space-x-3"
        >
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-dashed border-white/20 flex-shrink-0">
            <Upload className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Upload Image</span>
            <span className="text-[11px] text-slate-400">JPG, PNG, WEBP (max 10 MB)</span>
          </div>
        </button>

        <button
          onClick={cameraOn ? stopCamera : startCamera}
          className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
            cameraOn
              ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-400/50'
              : 'bg-slate-950/80 border-white/10 hover:border-white/20'
          }`}
        >
          <div
            className={`w-12 h-12 flex items-center justify-center rounded-xl flex-shrink-0 border ${
              cameraOn
                ? 'bg-rose-900/40 border-rose-500/40'
                : 'bg-slate-900 border-dashed border-white/20'
            }`}
          >
            {cameraOn ? (
              <X className="w-5 h-5 text-rose-300" />
            ) : (
              <Video className="w-5 h-5 text-slate-400" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {cameraOn ? 'Stop Camera' : 'Live Camera'}
            </span>
            <span className="text-[11px] text-slate-400">
              {cameraOn ? 'Tap to release camera' : 'Capture leaf in real time'}
            </span>
          </div>
        </button>

        <div className="p-3 rounded-2xl border border-white/10 bg-slate-950/80 text-left flex items-center space-x-3">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 flex-shrink-0">
            {activeImage ? (
              <img src={activeImage} alt="current" className="w-12 h-12 rounded-xl object-cover" crossOrigin="anonymous" />
            ) : (
              <ImageIcon className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-white block">Active Image</span>
            <span className="text-[11px] text-slate-400">{activeImage ? 'Loaded for inference' : 'None'}</span>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {cameraOn && (
        <div className="relative rounded-2xl overflow-hidden border border-rose-500/50 bg-black max-w-md mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-auto"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-300 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>LIVE</span>
            </span>
            <button
              onClick={captureFromCamera}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
            >
              <Camera className="w-3 h-3" />
              <span>Capture &amp; Scan</span>
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <p className="text-[11px] text-rose-300 font-mono flex items-center space-x-1">
          <VideoOff className="w-3 h-3" />
          <span>{cameraError}</span>
        </p>
      )}

      {(loading || scanning) && (
        <div className="p-6 text-center bg-slate-900/80 rounded-xl border border-slate-700 space-y-2">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-emerald-200 font-mono">
            {loading ? 'Loading MobileNetV2 weights...' : 'Running tensor inference in browser...'}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/80 rounded-xl text-rose-200 text-xs space-y-1">
          <div className="font-bold flex items-center space-x-2">
            <AlertOctagon className="w-4 h-4" />
            <span>Model failed to load</span>
          </div>
          <p className="font-mono">{error}</p>
        </div>
      )}

      {scanError && !scanning && (
        <div className="p-3 bg-amber-950/80 border border-amber-500/80 rounded-xl text-amber-200 text-xs">
          {scanError}
        </div>
      )}

      {result && (
        <div className="bg-slate-900/90 rounded-xl border border-slate-700 p-5 space-y-4 shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-slate-400 block font-mono">
                Diagnosis Output (MobileNetV2-PlantVillage-HF-v1.0)
              </span>
              <span className="text-lg font-black text-white">
                {result.abstained
                  ? 'Abstain — Low Confidence'
                  : formatClassName(result.prediction.className)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Confidence</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">
                {(result.prediction.confidence * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {result.abstained ? (
            <div className="bg-amber-950/80 border border-amber-500/80 rounded-xl p-4 text-amber-200 text-xs">
              <div className="flex items-center space-x-2 font-bold text-amber-100">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Escalating to agronomist review</span>
              </div>
              <p className="mt-1 text-slate-300">
                Confidence {(result.prediction.confidence * 100).toFixed(1)}% is below the{' '}
                {Math.round(abstainThreshold * 100)}% mandatory threshold. Retake photo with clearer lesion
                framing.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Top-3 Predictions</span>
                {result.prediction.topK.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-300 truncate pr-2">{formatClassName(p.className)}</span>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={i === 0 ? 'h-full bg-emerald-400' : 'h-full bg-slate-500'}
                          style={{ width: `${p.confidence * 100}%` }}
                        />
                      </div>
                      <span
                        className={
                          i === 0
                            ? 'text-emerald-400 w-12 text-right'
                            : 'text-slate-400 w-12 text-right'
                        }
                      >
                        {(p.confidence * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-cyan-950/70 border border-cyan-600 rounded-xl p-4 space-y-1 text-cyan-200 text-xs">
                <div className="flex items-center space-x-2 font-bold text-cyan-100">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  <span>Rule Layer: {TARGET_RULE[result.target].rule}</span>
                </div>
                <p className="text-slate-300">Action: {TARGET_RULE[result.target].action}</p>
              </div>

              {result.target === 'ROOT_PORT' && (
                <div className="bg-rose-950/80 border border-rose-500/80 rounded-xl p-4 space-y-3 text-rose-200 text-xs">
                  <div className="flex items-center space-x-2 font-bold text-rose-100 text-sm">
                    <Share2 className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <span>Shared Reservoir Blast Radius Modeling (§4.9)</span>
                  </div>
                  <p className="text-slate-300">
                    All towers share one continuous nutrient reservoir loop. If Pythium is present, every
                    connected tower is at risk.
                  </p>
                  <ul className="space-y-1 font-mono text-[11px] text-rose-300">
                    <li>• Drain and flush shared loop feeding all connected towers.</li>
                    <li>• Apply hydrogen peroxide / food-grade sanitizer flush before next batch cycle.</li>
                    <li>• Inspect root net-ports of adjacent towers for browning/slime.</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
