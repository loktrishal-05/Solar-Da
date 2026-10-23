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

## Agent layer (in progress, see docs/BLUEPRINT.md)

```bash
npm run build                                   # engine, contracts, api, web
npm run test:engine
npm test -w @terrasub-solarda/contracts         # Zod contracts: valid/invalid fixtures
npm run schemas -w @terrasub-solarda/contracts  # export JSON Schema -> packages/contracts/schemas
powershell -File scripts/gen_models.ps1         # regenerate Pydantic models in services/agents/app/models

# Python services (CPython 3.11, separate venvs)
py -3.11 -m venv services/agents/.venv && services/agents/.venv/Scripts/pip install -r services/agents/requirements.lock
py -3.11 -m venv services/twin/.venv   && services/twin/.venv/Scripts/pip install -r services/twin/requirements.lock
cd services/agents && .venv/Scripts/python -m pytest -q && .venv/Scripts/python -m uvicorn app.main:app --port 8000
```

Audit of existing features: `docs/AUDIT.md`. Decisions (theme, interpreters, owners): `docs/DECISIONS.md`.
