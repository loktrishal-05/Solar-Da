# TerraSub & Solar-Da v3.0

Precision Agriculture OS — biodegradable substrate management, vertical tower control, plant disease detection (AI), and farmer co-op marketplace.

## What's in this repo

- **`weiqou/web`** — Vite + React 18 + TypeScript frontend (light + dark theme variants)
- **`weiqou/api`** — Express backend (proposals, telemetry, alerts)
- **`weiqou/electron` — _not present in this repo (README claim removed; see docs/AUDIT.md)_
- **`packages/engine`** — Core simulation engine (substrate recipes, control agents, safety invariants)
- **`packages/contracts`** — Shared TypeScript types

## Quick start (Windows)

```cmd
setup_and_test.bat
```

This one-click script:
1. Installs npm dependencies
2. Downloads the pre-converted MobileNet-PlantVillage TF.js model from Hugging Face
3. Starts the Vite dev server

Then open `http://localhost:3000`.

For a **public HTTPS tunnel** (so you can share the app with anyone, including live camera on mobile):
```cmd
start_public.bat
```

## AI Plant Disease Detection

The Crop Doctor section runs a real TensorFlow.js model in your browser — no data leaves your device.

- **Model:** MobileNet trained on PlantVillage (38 classes covering Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato diseases + healthy)
- **Source:** [`jatindongre69/kisanai-plant-disease-tfjs`](https://huggingface.co/jatindongre69/kisanai-plant-disease-tfjs) on Hugging Face
- **Runtime:** `@tensorflow/tfjs` with WebGL backend
- **Input sources:** file upload, drag-and-drop, live camera (`getUserMedia` with `facingMode: 'environment'`)
- **Safety:** 75% confidence abstention gate — model returns "abstain" instead of a low-confidence guess

See `docs/PLANT_DISEASE_MODEL.md` for full details.

## Other documentation

- `docs/PLANT_DISEASE_MODEL.md` — Plant disease model architecture, setup, troubleshooting
- `docs/HANDOFF.md` — Working notes / handoff doc from prior teammate (includes aspirational roadmap)
- `docs/terrasub-solarda-master-prompt.md` — Master project prompt and feature spec

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts
- **ML:** TensorFlow.js (browser-side inference)
- **Backend:** Express, Node.js
- **Desktop:** Electron
- **Monorepo:** npm workspaces

## Safety invariants

The platform enforces 13 hard safety invariants (pH ceilings, EC bounds, VPD ranges, etc.) on every actuator proposal. The "E-STOP" button in the navbar is a hardware-interlock override that disables all automatic actions.

## Agent layer (agentic smart agriculture, see docs/BLUEPRINT.md and docs/AGENT_LAYER.md)

A LangGraph farm-shift agent replays public datasets as its sensor feed (EDEN ISS 2020, HydroGrowNet), compares
irrigation options in an AquaCrop twin with Open-Meteo weather for Chennai, diagnoses leaf photos with a calibrated
classifier that abstains when unsure, and answers farmer questions in Tamil or English from approved sources only.
The LLM (optional) only proposes; the TypeScript engine's safety check decides, and humans approve treatments.
**There are no live sensors: everything shown is replayed, simulated or from the twin, and is labelled so.**

```powershell
# one-time setup
npm install; npm run build
py -3.11 -m venv services/agents/.venv; services/agents/.venv/Scripts/pip install -r services/agents/requirements.lock
py -3.11 -m venv services/twin/.venv;   services/twin/.venv/Scripts/pip install -r services/twin/requirements.lock
py -3.11 -m venv services/vision/.venv; services/vision/.venv/Scripts/pip install -r services/vision/requirements.lock
powershell -ExecutionPolicy Bypass -File scripts/fetch_vision_model.ps1
powershell -ExecutionPolicy Bypass -File scripts/fetch_sensor_models.ps1   # sensor forecasters, anomaly detector, soil model

# run (offline after setup), then open http://localhost:3000 -> Agent Console
powershell -ExecutionPolicy Bypass -File scripts/start_all.ps1
```

Tests: `npm run test:engine`, `npm test -w @terrasub-solarda/api`, `npm test -w @terrasub-solarda/contracts`,
`services/*/.venv/Scripts/python -m pytest -q` in each service, red team in `redteam/`, benchmark in `bench/`.

Docs: `docs/AGENT_LAYER.md` (architecture), `docs/AUDIT.md` (what is real, UI-only or broken),
`docs/DECISIONS.md` (theme, interpreters, irrigation rule, retrieval, model hosting), `bench/results/` (numbers).
