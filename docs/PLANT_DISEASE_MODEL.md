# Plant Disease Detection — Real Model Integration

This project uses a real TensorFlow.js plant disease model running entirely in the browser.

## Model

- **Source:** [`jatindongre69/kisanai-plant-disease-tfjs`](https://huggingface.co/jatindongre69/kisanai-plant-disease-tfjs) (pre-converted TF.js layers model on Hugging Face)
- **Architecture:** MobileNetV1 (Keras, layers model) fine-tuned on PlantVillage
- **Input:** 224x224 RGB, normalized to `[0, 1]` (MobileNetV1 standard: `x / 255.0`)
- **Output:** 38 class probabilities (PlantVillage diseases + healthy across 14 crop species)
- **Format:** TF.js layers model (`tf.loadLayersModel`)
- **Location:** `weiqou/web/public/models/plant-disease/`
- **Total size:** ~13 MB

## Files

```
weiqou/web/public/models/plant-disease/
├── model.json              # graph + weight manifest
├── group1-shard1of4.bin    # 4 MB
├── group1-shard2of4.bin    # 4 MB
├── group1-shard3of4.bin    # 4 MB
├── group1-shard4of4.bin    # 0.5 MB
├── class_indices.json      # raw HF format
└── class_names.json        # same as class_indices.json (used by hook)
```

## PlantVillage 38 Classes

Apple (scab, black rot, cedar rust, healthy), Blueberry, Cherry (powdery mildew, healthy), Corn (gray spot, common rust, northern blight, healthy), Grape (black rot, esca, leaf blight, healthy), Orange (citrus greening), Peach (bacterial spot, healthy), Pepper bell (bacterial spot, healthy), Potato (early blight, late blight, healthy), Raspberry, Soybean, Squash (powdery mildew), Strawberry (leaf scorch, healthy), Tomato (bacterial spot, early blight, late blight, leaf mold, septoria, spider mites, target spot, yellow leaf curl, mosaic, healthy).

## How It Was Set Up

The model was downloaded directly from Hugging Face via PowerShell (no Python needed) — see `scripts/download_tfjs_model.ps1` for the one-liner.

## Run

```bash
cd weiqou/web
npm run dev
```

The disease detector component (`LightCropDoctorSection.tsx`) loads the model on mount via `useDiseaseDetector` hook.

## Image Sources

1. **Sample photos** — Pre-selected reference images
2. **File upload** — JPG/PNG/WEBP up to 10 MB, drag-drop or click to browse
3. **Live camera** — `navigator.mediaDevices.getUserMedia()` with `facingMode: 'environment'`. Tapping "Capture & Scan" draws the video frame to a canvas and runs inference immediately.

Camera access requires `localhost` (dev) or HTTPS (production).

## Files Added/Modified

- `weiqou/web/public/models/plant-disease/` — TF.js model files (downloaded from HF, not in source control)
- `weiqou/web/src/hooks/useDiseaseDetector.ts` — React hook using `tf.loadLayersModel`
- `weiqou/web/src/components/LightCropDoctorSection.tsx` — UI with **drag-drop, file upload, live camera, sample reference**
- `weiqou/web/src/components/TerraSub/DiseaseDetector.tsx` — TerraSub dark-theme variant
- `weiqou/web/src/components/SolarDa/CropDoctorRoots.tsx` — Solar-Da root/canopy scanner
- `package.json` (root) — `@tensorflow/tfjs` added to devDependencies
- `scripts/download_tfjs_model.ps1` — PowerShell download script
- `setup_and_test.bat` — Convenience wrapper (skips Python now that model is pre-converted)
- `start_dev.bat` — Quick dev server start

## What The Model Does NOT Cover

- **Root-rot / Pythium on root-port images** — PlantVillage does not include CEA root-port images. The rule-based layer (Tipburn vs. Pythium blast radius) is applied on top.
- **Tipburn vs pathogen discrimination** — Rule-based (VPD + EC telemetry), not CNN.
- **Bounding boxes / lesion localization** — This model is classifier-only. For detection (YOLOv11) see project roadmap.
