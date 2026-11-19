import { useCallback, useEffect, useState } from 'react';

export type DiseasePrediction = {
  classIndex: number;
  className: string;
  confidence: number;
  topK: Array<{ classIndex: number; className: string; confidence: number }>;
  modelVersion: string;
  inferenceTimeMs: number;
  // Set by the server model (services/vision): its own calibrated threshold and abstain decision.
  threshold?: number;
  abstain?: boolean;
  reason?: string;
  // True when the plant gate decided the photo is not a plant at all (no disease is named).
  notALeaf?: boolean;
};

const SERVER_URL = '/vision/classify';
const SERVER_MODEL = 'EfficientNetV2-B0 vision-v1 (Solarda vision service)';

// Calibrated server model first (PlantVillage + PlantDoc, abstains on blur and low confidence).
// Returns null when the service is unreachable.
export async function classifyOnServer(el: HTMLImageElement | HTMLCanvasElement): Promise<DiseasePrediction | null> {
  const start = performance.now();
  try {
    let canvas = el as HTMLCanvasElement;
    if (!(el instanceof HTMLCanvasElement)) {
      canvas = document.createElement('canvas');
      canvas.width = el.naturalWidth || el.width;
      canvas.height = el.naturalHeight || el.height;
      canvas.getContext('2d')!.drawImage(el, 0, 0);
    }
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.92));
    if (!blob) return null;
    const form = new FormData();
    form.append('image', blob, 'leaf.jpg');
    const r = await fetch(SERVER_URL, { method: 'POST', body: form, signal: AbortSignal.timeout(15000) });
    if (r.status === 503) throw new Error('The leaf model files are not installed on this machine. Run scripts/fetch_vision_model.ps1 (or make setup), then restart.');
    if (!r.ok) return null;
    const d = await r.json();
    const topK = (d.predictions ?? []).map((p: any) => ({ classIndex: -1, className: p.label, confidence: p.confidence }));
    const best = topK[0] ?? { classIndex: -1, className: '', confidence: 0 };
    return {
      ...best, topK, modelVersion: SERVER_MODEL, inferenceTimeMs: performance.now() - start,
      threshold: d.threshold, abstain: !!d.abstain, reason: d.reason, notALeaf: !!d.not_a_leaf,
    };
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('The leaf model files')) throw e;
    return null;
  }
}

export type DiseaseDetectorState = { loading: boolean; error: string | null; ready: boolean };

// Default gate when the server does not send its own calibrated threshold.
const ABSTAIN_THRESHOLD = 0.75;
const NOT_RUNNING = 'The leaf model is not reachable. Start the local stack with make dev.';

// The calibrated vision service is the only classifier. (A browser TF.js fallback existed but never shipped its model files.)
export function useDiseaseDetector() {
  const [state, setState] = useState<DiseaseDetectorState>({ loading: true, error: null, ready: false });

  useEffect(() => {
    let stop = false;
    fetch('/vision/metrics')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => { if (!stop) setState({ loading: false, error: null, ready: true }); })
      .catch(() => { if (!stop) setState({ loading: false, error: NOT_RUNNING, ready: false }); });
    return () => { stop = true; };
  }, []);

  const predict = useCallback(async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<DiseasePrediction> => {
    const p = await classifyOnServer(imageElement);
    if (!p) throw new Error(NOT_RUNNING);
    return p;
  }, []);

  return { ...state, predict, abstainThreshold: ABSTAIN_THRESHOLD };
}

export function isAbstain(prediction: DiseasePrediction | null, threshold = ABSTAIN_THRESHOLD) {
  return !prediction || !!prediction.abstain || prediction.confidence < (prediction.threshold ?? threshold);
}
