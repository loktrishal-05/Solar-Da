import { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

export type DiseasePrediction = {
  classIndex: number;
  className: string;
  confidence: number;
  topK: Array<{ classIndex: number; className: string; confidence: number }>;
  modelVersion: string;
  inferenceTimeMs: number;
};

export type DiseaseDetectorState = {
  model: tf.LayersModel | null;
  classNames: Record<string, string>;
  loading: boolean;
  error: string | null;
  ready: boolean;
};

const MODEL_URL = '/models/plant-disease/model.json';
const CLASS_NAMES_URL = '/models/plant-disease/class_names.json';
const TOP_K = 3;
const ABSTAIN_THRESHOLD = 0.75;

export function useDiseaseDetector() {
  const [state, setState] = useState<DiseaseDetectorState>({
    model: null,
    classNames: {},
    loading: true,
    error: null,
    ready: false,
  });
  const modelRef = useRef<tf.LayersModel | null>(null);
  const classNamesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));

        await tf.ready();
        try {
          await tf.setBackend('webgl');
        } catch {
          /* fall back to default */
        }

        const [model, classNames] = await Promise.all([
          tf.loadLayersModel(MODEL_URL),
          fetch(CLASS_NAMES_URL).then((r) => {
            if (!r.ok) throw new Error(`class_names.json HTTP ${r.status}`);
            return r.json();
          }),
        ]);

        if (cancelled) {
          model.dispose();
          return;
        }

        modelRef.current = model;
        classNamesRef.current = classNames;

        setState({
          model,
          classNames,
          loading: false,
          error: null,
          ready: true,
        });
      } catch (err: any) {
        if (cancelled) return;
        setState({
          model: null,
          classNames: {},
          loading: false,
          error: err?.message || 'Failed to load model',
          ready: false,
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keras MobileNet preprocessing (tf.keras.applications.mobilenet.preprocess_input):
  //   x = x / 127.5
  //   x = x - 1.0
  // This maps pixel [0, 255] -> [-1, 1]. The downloaded kisanai model was trained
  // with this preprocessing, NOT simple /255.
  const preprocess = useCallback((imageElement: HTMLImageElement | HTMLCanvasElement): tf.Tensor => {
    return tf.tidy(() => {
      const img = tf.browser.fromPixels(imageElement);
      const resized = tf.image.resizeBilinear(img, [224, 224]);
      return resized.toFloat().div(tf.scalar(127.5)).sub(tf.scalar(1)).expandDims(0);
    });
  }, []);

  const predict = useCallback(
    async (
      imageElement: HTMLImageElement | HTMLCanvasElement,
      topK: number = TOP_K
    ): Promise<DiseasePrediction | null> => {
      if (!modelRef.current) {
        throw new Error('Model not loaded yet');
      }

      const start = performance.now();
      const inputTensor = preprocess(imageElement);
      const outputTensor = modelRef.current.predict(inputTensor) as tf.Tensor;
      const probabilities = await outputTensor.data();
      inputTensor.dispose();
      outputTensor.dispose();

      const probs = Array.from(probabilities as Float32Array);
      const sorted = probs
        .map((p, i) => ({ p, i }))
        .sort((a, b) => b.p - a.p);

      const top = sorted.slice(0, topK).map(({ p, i }) => ({
        classIndex: i,
        className: classNamesRef.current[String(i)] || `Class_${i}`,
        confidence: p,
      }));

      const best = top[0];
      const inferenceTimeMs = performance.now() - start;

      return {
        classIndex: best.classIndex,
        className: best.className,
        confidence: best.confidence,
        topK: top,
        modelVersion: 'MobileNet-PlantVillage-38-v1.0',
        inferenceTimeMs,
      };
    },
    [preprocess]
  );

  return {
    ...state,
    predict,
    abstainThreshold: ABSTAIN_THRESHOLD,
  };
}

export function isAbstain(prediction: DiseasePrediction | null, threshold = ABSTAIN_THRESHOLD) {
  return !prediction || prediction.confidence < threshold;
}
