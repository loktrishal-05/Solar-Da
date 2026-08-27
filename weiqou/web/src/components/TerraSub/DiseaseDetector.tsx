import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  Smartphone,
  Upload,
  Cpu,
  Clock,
  Video,
  VideoOff,
  StopCircle,
  ImageIcon,
  X,
} from 'lucide-react';
import { useDiseaseDetector, isAbstain, DiseasePrediction } from '../../hooks/useDiseaseDetector';

type ScanResult = {
  prediction: DiseasePrediction;
  isHealthy: boolean;
  abstained: boolean;
  abstainReason?: string;
};

type SourceMode = 'sample' | 'upload' | 'camera';

export const DiseaseDetector: React.FC = () => {
  const { model, classNames, loading, error, ready, predict, abstainThreshold } = useDiseaseDetector();

  const [selectedImage, setSelectedImage] = useState<string | null>(
    '/media/plant-samples/tomato-early-blight.jpg'
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const [sourceMode, setSourceMode] = useState<SourceMode>('sample');
  const [cameraOn, setCameraOn] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraContainerRef = useRef<HTMLDivElement | null>(null);

  const sampleImages = [
    {
      label: 'Tomato — Early Blight (reference)',
      url: '/media/plant-samples/tomato-early-blight.jpg',
    },
  ];

  useEffect(() => {
    if (ready && sourceMode === 'sample' && selectedImage && !result) {
      runScan(selectedImage);
    }
  }, [ready, sourceMode, selectedImage]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const loadImageElement = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });
  };

  const runScanFromElement = async (el: HTMLImageElement | HTMLCanvasElement) => {
    setIsScanning(true);
    setScanError(null);
    setResult(null);
    try {
      const prediction = await predict(el, 3);
      if (!prediction) throw new Error('No prediction returned');

      const isAbstaining = isAbstain(prediction, abstainThreshold);
      const healthyKeywords = ['healthy'];
      const isHealthy = !isAbstaining && healthyKeywords.some((k) => prediction.className.toLowerCase().includes(k));

      setResult({
        prediction,
        isHealthy,
        abstained: isAbstaining,
        abstainReason: isAbstaining
          ? `Model confidence ${(prediction.confidence * 100).toFixed(1)}% is below mandatory ${(
              abstainThreshold * 100
            ).toFixed(0)}% threshold. Retake photo with clearer framing on the lesion, or escalate to agronomist.`
          : undefined,
      });
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const runScan = async (imageUrl: string) => {
    if (!ready) {
      setScanError('Model still loading, please wait...');
      return;
    }
    try {
      const img = await loadImageElement(imageUrl);
      await runScanFromElement(img);
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
      setIsScanning(false);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setResult(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera API not available in this browser. Use HTTPS or a modern browser (Chrome/Edge/Firefox).');
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
          ? 'Camera permission denied. Click the camera icon in your address bar to allow access.'
          : err?.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : `Camera error: ${err?.message || 'unknown'}`
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !ready) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setCameraError('Could not access 2D canvas context.');
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setSelectedImage(dataUrl);
    setSourceMode('camera');
    stopCamera();
    await runScanFromElement(canvas);
  };

  const handleSelectSample = (url: string) => {
    setResult(null);
    setSelectedImage(url);
    setSourceMode('sample');
    stopCamera();
  };

  const handlePickUpload = () => {
    stopCamera();
    setResult(null);
    fileInputRef.current?.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setScanError('File too large (max 10 MB).');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setResult(null);
      setSelectedImage(dataUrl);
      setSourceMode('upload');
      runScanFromUrl(dataUrl);
    };
    reader.onerror = () => setScanError('Could not read the file.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const runScanFromUrl = async (url: string) => {
    try {
      const img = await loadImageElement(url);
      await runScanFromElement(img);
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
      setIsScanning(false);
    }
  };

  const clearSelection = () => {
    setResult(null);
    setSelectedImage(null);
    setSourceMode('sample');
  };

  const formatClassName = (name: string) =>
    name
      .replace(/___/g, ' — ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-[#090b10] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Camera className="w-6 h-6 text-purple-400" />
            <h2 className="font-display text-2xl font-extrabold text-white">In-Browser Plant Disease Detector</h2>
          </div>
          <p className="text-xs text-slate-400">
            MobileNetV2 fine-tuned on PlantVillage (38 classes) — runs 100% client-side in browser. Confidence
            abstention at {Math.round(abstainThreshold * 100)}%. Upload or capture live.
          </p>
        </div>
        <span className="px-3 py-1 bg-purple-950 text-purple-300 border border-purple-800/40 text-xs font-bold rounded-full font-mono">
          Model: MobileNetV2-PlantVillage-HF-v1.0
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start bg-slate-950/80 p-5 rounded-2xl border border-white/10">
        <div className="md:col-span-5 flex justify-center">
          <div
            ref={cameraContainerRef}
            className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-w-[320px] w-full bg-slate-900"
          >
            {cameraOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto object-cover bg-black"
                  style={{ maxHeight: '420px' }}
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
                    <span>Capture & Scan</span>
                  </button>
                </div>
              </>
            ) : selectedImage ? (
              <>
                <img
                  src={selectedImage}
                  alt="Leaf sample"
                  className="w-full h-auto object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                <span className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-emerald-400 bg-slate-950/80 backdrop-blur p-1 rounded border border-white/10 text-center">
                  {sourceMode === 'camera'
                    ? 'Captured from camera'
                    : sourceMode === 'upload'
                    ? 'Uploaded image'
                    : 'Field Device Reference'}
                </span>
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1 bg-slate-950/80 hover:bg-rose-900/80 rounded-full text-slate-300 hover:text-white"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-full h-48 flex flex-col items-center justify-center text-slate-500 text-xs space-y-2 p-4">
                <ImageIcon className="w-10 h-10 text-slate-700" />
                <span>No image selected. Choose an option below.</span>
              </div>
            )}
          </div>
        </div>

        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Smartphone className="w-4 h-4" />
            <span className="eyebrow-quiet text-emerald-400">REAL-TIME TENSORFLOW.JS INFERENCE</span>
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            {result
              ? result.abstained
                ? 'Model Abstained — Confidence Below Threshold'
                : result.isHealthy
                ? 'Healthy Leaf Detected'
                : `Detected: ${formatClassName(result.prediction.className)}`
              : cameraOn
              ? 'Camera live — frame the leaf and tap Capture & Scan'
              : 'Pick a sample, upload an image, or start the camera'}
          </h3>
          {result && !result.abstained && (
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              Inference completed in {result.prediction.inferenceTimeMs.toFixed(0)} ms. Top prediction carries{' '}
              <span className="text-emerald-400 font-mono">
                {(result.prediction.confidence * 100).toFixed(2)}%
              </span>{' '}
              confidence across {Object.keys(classNames).length} PlantVillage classes.
            </p>
          )}
          <div className="flex items-center flex-wrap gap-2 text-[11px] font-mono text-slate-400 pt-2">
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 flex items-center space-x-1">
              <Cpu className="w-3 h-3" />
              <span>Backend: {model ? 'webgl' : 'cpu'}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{result ? `${result.prediction.inferenceTimeMs.toFixed(0)} ms` : 'idle'}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              {result?.abstained ? 'Abstain' : result ? 'Result' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="eyebrow-quiet block">Image Source</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sampleImages.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(sample.url)}
              className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                sourceMode === 'sample' && selectedImage === sample.url
                  ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-400/50'
                  : 'bg-slate-950/80 border-white/10 hover:border-white/20'
              }`}
            >
              <img
                src={sample.url}
                alt={sample.label}
                className="w-12 h-12 object-cover rounded-xl flex-shrink-0 border border-white/10"
                crossOrigin="anonymous"
              />
              <div>
                <span className="text-xs font-bold text-white block">{sample.label}</span>
                <span className="text-[11px] text-slate-400">PlantVillage reference</span>
              </div>
            </button>
          ))}

          <button
            onClick={handlePickUpload}
            className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
              sourceMode === 'upload'
                ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-400/50'
                : 'bg-slate-950/80 border-white/10 hover:border-white/20'
            }`}
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
                <StopCircle className="w-5 h-5 text-rose-300" />
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

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
        {cameraError && (
          <p className="text-[11px] text-rose-300 font-mono flex items-center space-x-1">
            <VideoOff className="w-3 h-3" />
            <span>{cameraError}</span>
          </p>
        )}
      </div>

      {(loading || isScanning) && (
        <div className="p-8 text-center bg-slate-950/80 rounded-2xl border border-purple-800/40 space-y-3 animate-pulse">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-purple-200">
            {loading
              ? 'Loading MobileNetV2 model weights from /models/plant-disease/...'
              : 'Running TF.js tensor inference in browser...'}
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/80 rounded-2xl text-rose-200 text-xs space-y-1">
          <div className="font-bold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Model failed to load</span>
          </div>
          <p className="font-mono">{error}</p>
          <p className="text-[11px] text-rose-300/80">
            Run <code>setup_and_test.bat</code> or{' '}
            <code>python scripts/convert_hf_to_tfjs.py</code> to generate the TF.js model files, then restart the
            dev server.
          </p>
        </div>
      )}

      {scanError && !loading && !isScanning && (
        <div className="p-4 bg-amber-950/80 border border-amber-500/80 rounded-2xl text-amber-200 text-xs">
          <span className="font-bold">Scan error:</span> {scanError}
        </div>
      )}

      {result && (
        <div className="bg-slate-950/90 rounded-2xl border border-white/10 p-6 space-y-4 shadow-inner">
          {result.abstained ? (
            <div className="bg-amber-950/80 border border-amber-500/80 rounded-2xl p-4 text-amber-200 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-100 text-sm">
                <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                <span>MODEL ABSTAINED — Confidence Below {Math.round(abstainThreshold * 100)}% Threshold</span>
              </div>
              <p className="text-xs leading-relaxed text-amber-200">{result.abstainReason}</p>
              <div className="flex items-center space-x-2 text-[11px] font-mono pt-1">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  Top guess: {formatClassName(result.prediction.className)} ({(result.prediction.confidence * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="eyebrow-quiet block text-[10px]">PRIMARY DIAGNOSIS RESULT</span>
                  <span className="font-display text-xl font-extrabold text-white">
                    {formatClassName(result.prediction.className)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="eyebrow-quiet block text-[10px]">MODEL CONFIDENCE</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {(result.prediction.confidence * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="bg-slate-900 p-4 rounded-xl border border-white/10 space-y-2">
                <h4 className="font-bold text-purple-300 uppercase tracking-wider text-xs flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  <span>Top-3 Predictions (PlantVillage 38 classes)</span>
                </h4>
                <div className="space-y-1.5">
                  {result.prediction.topK.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-300 truncate pr-2">{formatClassName(p.className)}</span>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${i === 0 ? 'bg-emerald-400' : 'bg-slate-500'}`}
                            style={{ width: `${p.confidence * 100}%` }}
                          />
                        </div>
                        <span className={i === 0 ? 'text-emerald-400 w-12 text-right' : 'text-slate-400 w-12 text-right'}>
                          {(p.confidence * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {result.isHealthy ? (
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-emerald-200 text-xs">
                  <span className="font-bold">Healthy canopy confirmed.</span> Continue current fertigation schedule
                  and re-scan in 48-72 hours.
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-3 text-rose-200 text-xs space-y-1">
                  <p className="font-bold">Recommended Action</p>
                  <p>
                    Disease detected. Generate a fertigation & isolation proposal from the Control Center, isolate
                    affected grow unit, and escalate to agronomist for confirmation.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
