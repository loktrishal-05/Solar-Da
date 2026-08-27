import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  UploadCloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Video,
  VideoOff,
  ImageIcon,
  Cpu,
  Clock,
  X,
} from 'lucide-react';
import { useDiseaseDetector, isAbstain, DiseasePrediction } from '../hooks/useDiseaseDetector';

interface LightCropDoctorSectionProps {
  onCreateProposal: (protocolName: string) => void;
}

type SourceMode = 'sample' | 'upload' | 'camera';

export const LightCropDoctorSection: React.FC<LightCropDoctorSectionProps> = ({ onCreateProposal }) => {
  const { model, classNames, loading, error, ready, predict, abstainThreshold } = useDiseaseDetector();

  const [selectedImage, setSelectedImage] = useState<string>(
    '/media/plant-samples/tomato-early-blight.jpg'
  );
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<DiseasePrediction | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sourceMode, setSourceMode] = useState<SourceMode>('sample');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [inferenceMs, setInferenceMs] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const confidence = prediction?.confidence ?? 0;
  const abstained = isAbstain(prediction, abstainThreshold);

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

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.src = src;
    });

  const runScanFromElement = async (el: HTMLImageElement | HTMLCanvasElement) => {
    if (!ready) {
      setScanError('Model still loading, please wait...');
      setIsScanning(false);
      return;
    }
    setIsScanning(true);
    setScanError(null);
    setPrediction(null);
    setInferenceMs(null);
    try {
      const p = await predict(el, 3);
      if (!p) throw new Error('No prediction returned');
      setPrediction(p);
      setInferenceMs(p.inferenceTimeMs);
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const runScanFromUrl = async (url: string) => {
    if (!ready) {
      setScanError('Model still loading...');
      return;
    }
    setIsScanning(true);
    setScanError(null);
    try {
      const img = await loadImage(url);
      await runScanFromElement(img);
    } catch (err: any) {
      setScanError(err?.message || 'Scan failed');
      setIsScanning(false);
    }
  };

  const handleScanSample = (imgUrl: string) => {
    setSourceMode('sample');
    setSelectedImage(imgUrl);
    stopCamera();
    runScanFromUrl(imgUrl);
  };

  const plantSamples = [
    { label: 'Tomato Early Blight', url: '/media/plant-samples/tomato-early-blight.jpg' },
    { label: 'Tomato Healthy', url: '/media/plant-samples/tomato-healthy.jpg' },
    { label: 'Potato Late Blight', url: '/media/plant-samples/potato-late-blight.jpg' },
    { label: 'Apple Scab', url: '/media/plant-samples/apple-scab.jpg' },
    { label: 'Corn Rust', url: '/media/plant-samples/corn-rust.jpg' },
    { label: 'Grape Black Rot', url: '/media/plant-samples/grape-black-rot.jpg' },
  ];

  const openFilePicker = () => {
    stopCamera();
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
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setSourceMode('upload');
      setSelectedImage(dataUrl);
      stopCamera();
      try {
        const img = await loadImage(dataUrl);
        await runScanFromElement(img);
      } catch (err: any) {
        setScanError(err?.message || 'Failed to scan uploaded image');
        setIsScanning(false);
      }
    };
    reader.onerror = () => setScanError('Could not read the file.');
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      setScanError('Please drop an image file (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setScanError('File too large (max 10 MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setSourceMode('upload');
      setSelectedImage(dataUrl);
      stopCamera();
      try {
        const img = await loadImage(dataUrl);
        await runScanFromElement(img);
      } catch (err: any) {
        setScanError(err?.message || 'Failed to scan dropped image');
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setCameraError(null);
    setPrediction(null);
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
      setSourceMode('camera');
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
    stopCamera();
    await runScanFromElement(canvas);
  };

  const formatClassName = (name: string) =>
    name
      .replace(/___/g, ' — ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <section
      id="crop-doctor"
      className="relative bg-white py-20 px-4 lg:px-8 border-b border-[#E5E7EB] font-sans overflow-hidden"
    >
      {/* Video Background #4 — Subtle Foliage Scan Video with 88% White Overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          src="/media/yrdr.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover filter saturate-[0.8] opacity-15"
        />
        <div className="absolute inset-0 bg-white/88" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Camera className="w-6 h-6 text-[#1B4332]" />
              <h2 className="font-display text-2xl font-extrabold text-[#1A1A1A]">
                AI Crop Doctor Station (MobileNet — PlantVillage 38 classes)
              </h2>
            </div>
            <p className="text-xs text-gray-500 font-normal">
              Real-time leaf disease classification with mandatory{' '}
              {Math.round(abstainThreshold * 100)}% safety abstention gate. 100% client-side, no data leaves the
              browser.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full font-mono border ${
                ready
                  ? 'bg-emerald-50 text-[#059669] border-emerald-200'
                  : loading
                  ? 'bg-amber-50 text-[#D97706] border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {ready ? '● TF.js Model Ready' : loading ? 'Loading model...' : 'Model unavailable'}
            </span>
            <span className="px-3.5 py-1 bg-[#E8F5E9] text-[#1B4332] border border-[#A5D6A7] text-xs font-bold rounded-full font-mono">
              MobileNet-PlantVillage-38-v1.0
            </span>
          </div>
        </div>

        {/* 50/50 Workstation Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: UPLOAD ZONE & PHOTO VIEWER WITH LASER SCANLINE */}
          <div className="lg:col-span-6 bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            {/* Drag & Drop / Upload / Camera Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={openFilePicker}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openFilePicker();
                }
              }}
              className={`bg-white p-6 rounded-2xl border-2 border-dashed text-center space-y-3 cursor-pointer transition ${
                isDragging
                  ? 'border-[#1B4332] bg-[#E8F5E9]'
                  : 'border-[#7CB342] hover:border-[#1B4332]'
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#E8F5E9] text-[#1B4332] flex items-center justify-center mx-auto">
                <UploadCloud className="w-6 h-6 text-[#7CB342]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-gray-900">
                  {isDragging ? 'Drop the image to scan' : 'Drag a leaf image here, or click to upload'}
                </h3>
                <p className="text-[11px] text-gray-500 font-mono">
                  JPG, PNG, WEBP up to 10 MB · PlantVillage 38 classes
                </p>
              </div>

              <div className="flex justify-center flex-wrap gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={openFilePicker}
                  className="px-4 py-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-extrabold rounded-full shadow-sm transition"
                >
                  Upload Image
                </button>
                <button
                  onClick={cameraOn ? stopCamera : startCamera}
                  className={`px-4 py-1.5 text-xs font-bold rounded-full shadow-sm transition flex items-center space-x-1 ${
                    cameraOn
                      ? 'bg-rose-100 text-rose-700 border border-rose-300'
                      : 'bg-white hover:bg-gray-50 text-[#1B4332] border border-[#1B4332]/20'
                  }`}
                >
                  {cameraOn ? (
                    <>
                      <X className="w-3 h-3" />
                      <span>Stop Camera</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3 h-3" />
                      <span>Live Camera</span>
                    </>
                  )}
                </button>
              </div>

              {/* Real PlantVillage sample thumbnails - the model was trained on these */}
              <div className="pt-3 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">
                  PlantVillage Reference Samples (real leaf photos, model trained on these)
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {plantSamples.map((sample) => {
                    const isActive = sourceMode === 'sample' && selectedImage === sample.url;
                    return (
                      <button
                        key={sample.url}
                        onClick={() => handleScanSample(sample.url)}
                        title={sample.label}
                        className={`p-1 rounded-lg border-2 transition ${
                          isActive
                            ? 'border-[#1B4332] ring-2 ring-[#7CB342]/40 bg-[#E8F5E9]'
                            : 'border-gray-200 hover:border-[#7CB342] bg-white'
                        }`}
                      >
                        <img
                          src={sample.url}
                          alt={sample.label}
                          className="w-full h-12 object-cover rounded"
                          crossOrigin="anonymous"
                        />
                        <span className="block text-[9px] text-gray-700 mt-1 truncate">{sample.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {cameraError && (
                <p className="text-[11px] text-rose-600 font-mono flex items-center justify-center space-x-1">
                  <VideoOff className="w-3 h-3" />
                  <span>{cameraError}</span>
                </p>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Photo Preview Viewer — switches between image, camera live feed, or placeholder */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden flex flex-col items-center">
              {cameraOn ? (
                <div className="relative rounded-xl overflow-hidden max-w-[400px] w-full border border-gray-200 bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto" />
                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                    <span className="text-[10px] font-mono text-emerald-300 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>LIVE</span>
                    </span>
                    <button
                      onClick={captureFromCamera}
                      className="px-3 py-1.5 bg-[#1B4332] hover:bg-[#143326] text-white text-xs font-bold rounded-full flex items-center space-x-1"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Capture & Scan</span>
                    </button>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="relative rounded-xl overflow-hidden max-w-[400px] w-full border border-gray-200">
                  <img src={selectedImage} alt="Crop Scan" className="w-full h-auto object-cover" crossOrigin="anonymous" />

                  {/* Animated Horizontal Scanline */}
                  {isScanning && (
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7CB342] to-transparent animate-scanline shadow-lg" />
                  )}

                  {/* Top-1 prediction badge */}
                  {!isScanning && prediction && !abstained && (
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                      <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                        {formatClassName(prediction.className)} ({(prediction.confidence * 100).toFixed(0)}%)
                      </span>
                      <span className="bg-white/90 backdrop-blur text-[9px] font-mono px-1.5 py-0.5 rounded shadow text-gray-700">
                        {prediction.modelVersion}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center text-gray-400 space-y-2 max-w-[400px] w-full">
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-xs">No image selected</span>
                </div>
              )}

              {isScanning && (
                <div className="mt-3 text-center text-xs font-bold text-[#1B4332] animate-pulse flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#7CB342]" />
                  <span>Running TF.js tensor inference...</span>
                </div>
              )}

              {!isScanning && prediction && (
                <div className="mt-3 w-full max-w-[400px] flex items-center justify-between text-[10px] font-mono text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Cpu className="w-3 h-3" />
                    <span>Backend: {model ? 'webgl' : 'cpu'}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{inferenceMs?.toFixed(0)} ms</span>
                  </span>
                  <span>
                    Source:{' '}
                    {sourceMode === 'upload'
                      ? 'uploaded file'
                      : sourceMode === 'camera'
                      ? 'camera capture'
                      : 'reference sample'}
                  </span>
                </div>
              )}
            </div>

            {error && !loading && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs space-y-1">
                <div className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Model failed to load</span>
                </div>
                <p className="font-mono">{error}</p>
                <p className="text-[10px] text-rose-600">
                  Run <code>setup_and_test.bat</code> or{' '}
                  <code>python scripts/convert_hf_to_tfjs.py</code> to generate the TF.js model files.
                </p>
              </div>
            )}

            {scanError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs">
                <span className="font-bold">Scan error:</span> {scanError}
              </div>
            )}
          </div>

          {/* RIGHT: DIAGNOSIS REPORT */}
          <div className="lg:col-span-6 bg-[#FAFAF8] p-6 rounded-2xl border border-gray-200 shadow-sm space-y-5">
            {/* Top Bar: Confidence Gauge */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={!abstained ? 'text-[#059669]' : 'text-[#D97706]'}
                      strokeDasharray={`${(confidence * 100).toFixed(0)}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="absolute font-mono font-bold text-xs text-gray-900">
                    {prediction ? `${(confidence * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Diagnostic Confidence Score</h3>
                  <span className="text-[10px] text-gray-500 font-mono block">
                    Safety Gate Ceiling: {Math.round(abstainThreshold * 100)}% · {Object.keys(classNames).length || 38} classes
                  </span>
                </div>
              </div>

              {prediction && (
                <span
                  className={`px-3 py-1 rounded-full font-mono text-xs font-bold ${
                    !abstained
                      ? 'bg-emerald-50 text-[#059669] border border-emerald-200'
                      : 'bg-amber-50 text-[#D97706] border border-amber-200'
                  }`}
                >
                  {!abstained
                    ? `VALIDATED (>${Math.round(abstainThreshold * 100)}%)`
                    : `ABSTENTION (<${Math.round(abstainThreshold * 100)}%)`}
                </span>
              )}
            </div>

            {/* ABSTENTION BANNER vs FULL TREATMENT PROTOCOL */}
            {!prediction ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-xs text-gray-500 space-y-2">
                <Camera className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="font-bold text-gray-700">No scan yet</p>
                <p>
                  Upload an image, drag a leaf photo onto the upload zone, or tap <strong>Live Camera</strong> to
                  capture a frame for analysis.
                </p>
              </div>
            ) : abstained ? (
              <div className="bg-[#FFF8E1] border-2 border-[#D97706] rounded-2xl p-5 space-y-4 text-xs">
                <div className="flex items-start space-x-2 text-[#D97706] font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block">ABSTENTION MANDATE: Low Confidence Prediction</span>
                    <span className="text-xs text-[#8D6E63] font-normal block mt-1 leading-relaxed">
                      Model confidence ({(confidence * 100).toFixed(2)}%) is below the mandatory{' '}
                      {Math.round(abstainThreshold * 100)}% safety threshold. Platform abstains from generating
                      chemical protocols and escalates to human agronomist review.
                    </span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1 text-[11px] font-mono text-gray-700">
                  <span className="font-bold text-gray-900 block font-sans">Top guess (insufficient confidence):</span>
                  <span>{formatClassName(prediction.className)}</span>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button className="flex-1 py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold rounded-full shadow transition">
                    Request Agronomist Review
                  </button>
                  <button
                    onClick={openFilePicker}
                    className="flex-1 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold rounded-full transition"
                  >
                    Retake Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-[#1B4332] text-sm flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-[#7CB342]" />
                      <span>{formatClassName(prediction.className)}</span>
                    </h4>
                    <span className="text-[10px] text-gray-500 font-mono block">
                      Classified by MobileNet-PlantVillage (Top-1 of {Object.keys(classNames).length || 38})
                    </span>
                  </div>
                </div>

                {/* Top-3 list */}
                <div className="space-y-1.5">
                  {prediction.topK.map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                      <span className={`truncate pr-2 ${i === 0 ? 'text-[#1B4332] font-bold' : 'text-gray-600'}`}>
                        {i === 0 ? '▶ ' : '   '}
                        {formatClassName(p.className)}
                      </span>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={i === 0 ? 'h-full bg-[#1B4332]' : 'h-full bg-gray-400'}
                            style={{ width: `${p.confidence * 100}%` }}
                          />
                        </div>
                        <span
                          className={
                            i === 0
                              ? 'text-[#059669] w-12 text-right font-bold'
                              : 'text-gray-500 w-12 text-right'
                          }
                        >
                          {(p.confidence * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Explanation */}
                <div className="space-y-2 text-gray-700">
                  <span className="font-bold text-gray-900 block font-mono text-[11px] uppercase">
                    {prediction.className.toLowerCase().includes('healthy')
                      ? 'Healthy Canopy Confirmed'
                      : 'Recommended Action'}
                  </span>
                  <p className="leading-relaxed text-gray-600 font-normal">
                    {prediction.className.toLowerCase().includes('healthy')
                      ? 'No disease symptoms detected. Continue current fertigation schedule and re-scan in 48-72 hours.'
                      : `Detected ${formatClassName(prediction.className)} with ${(prediction.confidence * 100).toFixed(1)}% confidence. Generate a treatment proposal to log the corrective action in the audit trail.`}
                  </p>
                </div>

                <button
                  onClick={() => onCreateProposal(formatClassName(prediction.className))}
                  className="w-full py-3 bg-[#1B4332] hover:bg-[#143326] text-white font-extrabold text-xs rounded-full shadow-sm transition"
                >
                  CREATE TREATMENT PROPOSAL
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Recent Scans Log */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider font-mono">
            PlantVillage Reference Gallery
          </h3>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {plantSamples.slice(0, 3).map((sample, i) => (
              <div
                key={sample.url}
                className="bg-[#FAFAF8] p-3 rounded-2xl border border-gray-200 shadow-sm flex items-center space-x-3 min-w-[240px]"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={sample.url}
                    alt={sample.label}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="text-xs font-mono">
                  <span className="font-bold text-gray-900 block">Sample #{i + 1}</span>
                  <span className="text-[#059669] font-bold text-[10px] block">
                    {prediction ? formatClassName(prediction.className) : sample.label}
                  </span>
                  <span className="text-gray-400 text-[9px] block">PlantVillage dataset</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
