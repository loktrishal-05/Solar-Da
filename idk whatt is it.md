Here is the **complete handoff document** summarizing everything discussed. Copy this entire block and paste it into your next LLM session.

---

# TERRASUB & SOLAR-DA v3 — PROJECT HANDOFF DOCUMENT

## 1. Project Overview

**TerraSub & Solar-Da v3** is a dual-mode agricultural intelligence platform:

| Mode | Purpose | Users | Horizon |
|------|---------|-------|---------|
| **TerraSub MVP** | Biodegradable soil-replacement substrate + app for horizontal grow units with moisture-pulse irrigation | Hackathon judges, growers | Hackathon MVP |
| **Solar-Da v3** | Control platform for soilless vertical towers fed by bounded nutrient reservoirs | Commercial growers, agronomists, buyers | Phased roadmap (M0–M8) |

**Core Promise:** Help growers understand what their crop is receiving, identify problems early, act only within safe boundaries, and prove how each harvest was produced.

---

## 2. Non-Negotiable Safety & Architecture Invariants

These are HARD RULES that must never be violated in code or UI:

1. **No automated physical execution** — Every actuation passes through: `tick → plan → actions → interlocks → dispatch → acknowledge → verify → audit`. AI/assistant/automation can only create **proposals**. Human confirmation is required for execution.
2. **Interlocks are veto-only**, evaluated last, re-evaluated at dispatch, never bypassable by any caller.
3. **`packages/engine` stays pure** — no I/O, no DB calls, injected time/randomness.
4. **Fixed dosing sequence**: top up water → mix → read → dose nutrient → mix → read → correct pH → mix → read. No readings during mixing delay.
5. **Every number must be sourced/explainable** — unsourced values flagged "unverified" in UI.
6. **ML outputs carry version, confidence, abstain path** — low confidence escalates, never guesses.
7. **Firmware mirrors server interlocks exactly** — network loss must never mean unsafe reservoirs.
8. **Commands are signed, sequenced, idempotent, expiring** — stale/unsafe commands NACK'd with reason.
9. **Never claim precise live NPK** in organic substrate. EC and moisture are trend **proxies** only.
10. **Crop recommender is a transparent heuristic**, not a trained model: `score = normalize(price_trend_7d) × 0.5 + climate_fit × 0.3 + substrate_suitability × 0.2`.
11. **Gelatin sourcing rule**: Fish/poultry-derived ONLY. Tannery-derived gelatin is explicitly prohibited in recipe calculator, copy, and validation logic (safety line due to chromium contamination in Tamil Nadu's Vellore–Ranipet belt).
12. **Marketplace is sandbox only** — system never holds buyer/seller funds directly.

---

## 3. Tech Stack

- **Frontend:** React 18 + TypeScript + Tailwind CSS + Lucide React icons + Recharts + Framer Motion
- **Backend:** Node.js + Express (TerraSub MVP uses Supabase for auth/DB/realtime)
- **Database:** Postgres + TimescaleDB (hypertables for time-series). Supabase accelerates TerraSub prototype.
- **Messaging:** MQTT ingest (per-device auth, replay protection) + Redis + BullMQ
- **Auth:** JWT access tokens with refresh rotation (humans); per-device credentials with replay protection (firmware)
- **Firmware:** ESP32 (WiFi required — NOT Arduino Uno)
- **ML:** TensorFlow.js client-side in browser for TerraSub disease detection (MobileNetV2 on PlantVillage). Solar-Da uses YOLOv11 + EfficientNetV3.
- **Assistant:** Gemini API behind in-process policy gateway (idempotency, retry/backoff, policy check every call)
- **Market Data:** Agmarknet / data.gov.in (India's open mandi price dataset)

---

## 4. UI/UX Evolution (CRITICAL CONTEXT)

### What Happened:
1. **Original State:** User had a dark-themed application already built (screenshots show dark background `#0a0a0a`, teal/cyan accents `#2dd4bf`, bold oversized headlines, glassmorphism cards, horizontal scrolling tab bar).
2. **User Requested:** Change to light theme + add missing features + background videos.
3. **Attempted:** Generated a light "Living Greenhouse" theme + dense SCADA dashboard layout.
4. **User Rejected:** "This looks like shit" — too many dense dashboard cards, destroyed the original aesthetic.
5. **User Requested:** REVERT to the **original dark theme** and integrate features INTO that existing design. Keep the spacious card-based layout, hero typography, and tab bar navigation.
6. **Current Consensus:** **DARK THEME PRESERVED**. Add all missing features natively into the existing dark UI.

### Current UI Structure (From Screenshots — PRESERVE THIS):
- **Top Nav Bar:** Logo "TERRASUB & SOLAR-DA v3.0" | TerraSub MVP toggle pill | Solar-Da v3 toggle pill | E-STOP button (red) | Assistant button | Notification bell
- **Hero Section:** Large bold headline "Reservoir Chemistry & Vertical CEA Control" (left) + "Hero Signal Focus" live telemetry card (right) showing uptake ratio diagnostic
- **Horizontal Scroll Tab Bar:** Reference Media Gallery | Reservoir & Tower Telemetry | Uptake Ratio Diagnostic | Human Confirmation Surface (1) | Root Net-Port Diagnostics | Solar-First Power Model | CEA Crop Planner | QR Traceability Passports
- **Content Sections:** Dark glassmorphism cards with teal/emerald accents
- **Community Section:** Thread cards with avatar, name, role badge, verified expert badge, title, preview, upvotes, replies

---

## 5. Features Currently Built (Inferred from Screenshots)
- ✅ Product mode toggle (TerraSub ↔ Solar-Da)
- ✅ Hero section with live telemetry focus card
- ✅ Horizontal tab navigation
- ✅ Reference Media Gallery (phone mockups showing disease scan, substrate calculator, irrigation notifications)
- ✅ Basic Reservoir & Tower Telemetry section
- ✅ Uptake Ratio Diagnostic display
- ✅ Human Confirmation Surface (shows pending count badge)
- ✅ Root Net-Port Diagnostics (Crop Doctor with Root Net-Port View / Canopy View toggle)
- ✅ Solar-First Power Model section
- ✅ CEA Crop Planner section
- ✅ QR Traceability Passports section
- ✅ Basic Community forum (thread cards with upvotes/replies)

---

## 6. Features MISSING & Need Integration

These must be added into the **existing dark theme UI** without destroying the aesthetic:

### A. Chatbot (Gemini-Powered Multimodal Assistant)
- **Location:** "Assistant" button in top nav opens slide-out panel from right (400px, dark glassmorphism)
- **Capabilities:** Text, Image upload/analysis, Voice input (Web Speech API), Document upload
- **Context-aware:** Reads current section, offers relevant help
- **Safety:** All responses cite sources. Tool calls create PROPOSALS only — never execute. Show "Review in Control Center" button.
- **UI:** Dark message bubbles, user messages with teal accent border, typing indicator, message history

### B. Irrigation Automation (Single-Click Control Center)
- **Location:** New tab "Irrigation Control" in horizontal tab bar
- **Layout:** Large visual cards (NOT dense grids). Animated SVG pipeline (Water Tank → Pump → Grow Units → Return) with flowing water animation.
- **Actions:** "IRRIGATE NOW" (teal button, 12-sec pulse), "DOSE NUTRIENT", "ADJUST pH", "FLUSH CYCLE"
- **Single-click flow:** Button → Confirmation modal → Execute → Toast notification
- **Threshold settings:** Elegant dark sliders for moisture low/high, pulse duration, cooldown
- **Event log:** Dark glass card showing last 5 events

### C. Plant Monitoring (Enhanced Telemetry)
- **Location:** "Reservoir & Tower Telemetry" tab (enhance existing)
- **Keep existing 6-card grid style:** Moisture, EC Proxy, pH, Temp, Humidity, Device
- **Add:** Sparkline mini-charts inside each card (teal line on dark). Live pulsing dot. Time range selector (1H | 24H | 7D | 30D). Main area chart below cards.
- **Each card has ONE action button:** IRRIGATE, DOSE, ADJUST, FAN, MIST, REBOOT

### D. Plant Disease Prediction (YOLOv11 + EfficientNetV3)
- **Location:** "Crop Doctor" / "Root Net-Port Diagnostics" tab (enhance existing)
- **Upload zone:** Large dashed-border card, teal accent on drag
- **Scanning animation:** Horizontal laser sweep, progress steps "YOLOv11 detecting... → EfficientNetV3 classifying..."
- **Results:** Bounding boxes on image (red=disease, yellow=deficiency, green=healthy)
- **Confidence handling:** <75% = amber banner "LOW CONFIDENCE — ESCALATING TO AGRONOMIST" + [Request Review] [Retake]. ≥75% = full diagnosis + treatment protocol.
- **Model version badge:** Must display "YOLOv11-CEA-vX.X | EfficientNetV3-BX"

### E. SMS Notifications & Alerts Center
- **Location:** Bell icon in top nav opens dark glassmorphism dropdown
- **Badge:** Shows unread count (amber if >0)
- **Sections:** CRITICAL (red border), WARNING (amber), INFO (blue)
- **Settings:** Dark toggle switches per category. Critical = locked ON.

### F. Market Demand Intelligence
- **Location:** New tab "Market Intelligence" in horizontal tab bar
- **Components:** Horizontal scrolling price ticker, dark area/candlestick chart, crop recommender score cards, demand heatmap (gray → teal → emerald)
- **Data:** Agmarknet/data.gov.in. Missing data stays missing (show "—").
- **Disclaimer:** "Scores are transparent heuristics. Missing market data stays missing."

### G. Farmer Community & Co-operative Formation
- **Location:** New tab "Community" in horizontal tab bar
- **Enhance existing:** Make thread cards interactive (upvote click increments, reply expands inline)
- **Add:** Filter tabs (ALL | MY CROPS | MARKET TALK | EQUIPMENT | ASK EXPERT), right sidebar (Trending, Co-op Buying Groups, Online Experts), inline reply forms, expert reply highlighting (teal left border)

---

## 7. Video Background Strategy (6 Videos, 10-sec loops)

| # | Section | Content | Treatment |
|---|---------|---------|-----------|
| 1 | Hero | Aerial greenhouse descent | Darkened 70%, gradient overlay |
| 2 | Reference Media Gallery | Subtle greenhouse motion | Darkened 60%, behind phone mockups |
| 3 | Crop Doctor | Macro leaf footage | Darkened 60%, behind upload cards |
| 4 | Irrigation Control | Water flow / drip emitter | Darkened 70%, behind pipeline |
| 5 | Market Intelligence | Indian mandi dawn market | Darkened 60%, behind price ticker |
| 6 | Community | Greenhouse/farm ambient | Darkened 70%, behind forum cards |

**Rule:** Videos are ambient atmosphere ONLY. Always darkened with overlay so text is readable. Muted, autoplay, loop, playsinline.

---

## 8. Hardware Components Discussed

### TerraSub MVP Starter Kit:
| Component | Spec |
|-----------|------|
| ESP32-WROOM-32 | WiFi onboard, NOT Arduino Uno |
| Capacitive Soil Moisture Sensor | v1.2, NOT conductive (corrosion-resistant) |
| Analog EC Probe | DFRobot or similar, calibrate with 1.413 & 12.88 mS/cm standards |
| Analog pH Probe | BNC-type, 2-point cal (pH 4.0 & 7.0 buffers) |
| DHT22 | Temp + humidity (ambient air) |
| 12V Submersible Water Pump | For irrigation pulses |
| 12V Peristaltic Dosing Pump | For fertilizer dosing (precise volume) |
| 5V Relay Module (2-ch) | Optocoupler isolated |
| 4mm/6mm Silicone Tubing | Food-grade |
| Power Supply | 5V for ESP32, 12V for pumps (use buck converter if single rail) |
| Jute/Coir Mesh Sleeve | For substrate packing |

### Solar-Da v3 Additional:
- Temp-compensated EC probe, DO probe (optical preferred), load cell + HX711 (mass), ultrasonic level sensor, circulation pump, 4× dosing pumps, aeration pump, solenoid valve, flow/pressure meter, PAR light sensor, CO₂ sensor (optional), ESP32-CAM (canopy/root imaging), hardware E-stop (mushroom button cutting power independently).

**WARNING:** Do NOT buy cheap "3-in-1 NPK sensors" — they are conductive, unreliable, and the spec forbids precise live NPK claims. Use EC + capacitive moisture as honest proxies.

---

## 9. Database Schema (TerraSub MVP)

```sql
users (id, name, phone, role[farmer|buyer|admin], created_at)
grow_units (id, user_id, label, substrate_batch_id, created_at)
substrate_batches (id, coir_pct, vermicompost_pct, biochar_pct, neem_cake_pct, bone_meal_pct, gelatin_grams, mixed_on, notes)
sensor_readings (id, grow_unit_id, recorded_at, moisture_pct, ec_ms_cm, ph, temp_c)
irrigation_events (id, grow_unit_id, triggered_at, trigger_type[auto|manual], duration_sec, fertilizer_dose_ml)
disease_reports (id, grow_unit_id, user_id, image_url, predicted_class, confidence, cure_steps jsonb, created_at)
crop_recommendations (id, region, crop_name, avg_mandi_price, price_trend_7d, climate_fit_score, generated_at)
chat_messages (id, user_id, session_id, role[user|assistant], content_type[text|image|voice], content, created_at)
marketplace_listings (id, user_id, crop_name, quantity_kg, price_per_kg, status[active|sold], created_at)
```

---

## 10. API Endpoints (TerraSub MVP)

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/sensors/reading` | ESP32 posts sensor reading |
| POST | `/api/irrigation/manual` | Manual water/dose trigger |
| GET | `/api/grow-units/:id/readings` | Dashboard data |
| POST | `/api/disease/report` | Log diagnosis result |
| GET | `/api/crops/recommendations?region=` | Scored crop list |
| POST | `/api/chat` | Proxy chat turn to Gemini |
| POST | `/api/substrate/batches` | Log substrate mix |
| GET/POST | `/api/marketplace/listings` | Harvest listings |

---

## 11. Substrate Recipe (Exact — Do Not Approximate)

Reference batch: **2 liters**, 1 part ≈ 100 ml.

| Ingredient | Parts | Amount (2L) | Role |
|------------|-------|-------------|------|
| Hydrated coco coir | 11 | 1,100 ml | Structure, aeration, water retention |
| Mature vermicompost | 5 | 500 ml | Primary nutrients, microbial life |
| Rice husk biochar (fallback: perlite) | 2 | 200 ml | Aeration/drainage |
| Neem cake powder | 1 | 100 ml | Pest deterrent, slow-release N |
| Bone meal or crushed dry eggshell | ½ | 50 ml | Calcium, phosphorus |
| Gelatin solution | — | 10g bloomed in 40ml cold water, dissolved in 150ml warm (not boiling) water | Nitrogen boost + natural binder |

**Hard rule:** Gelatin must be **fish- or poultry-derived ONLY**. Explicitly prohibit tannery-derived in calculator, copy, and validation.

---

## 12. Build Order (TerraSub MVP)

1. DB/auth scaffolding
2. Sensor ingestion + live dashboard (hardware first — riskiest piece)
3. Irrigation automation
4. Disease detection (TF.js in browser)
5. Substrate recipe calculator
6. Crop recommender
7. Chatbot
8. Decomposition tracker / marketplace (stretch)

---

## 13. Current Status & Next Steps

**What the user wants RIGHT NOW:**
- Revert to/preserve the **original dark theme UI** (screenshots show: dark bg, teal accents, bold headlines, glassmorphism cards, horizontal tab bar)
- Integrate all 7 missing features (Chatbot, Irrigation, Monitoring, Disease AI, SMS, Market, Community) **into that existing design**
- Add 6 background videos (darkened, ambient)
- Make it a real operating system: single-click actions, confirmation modals, live data, interactive charts
- Keep it spacious and cinematic — NOT a dense SCADA dashboard

**What to build next (ask user to pick):**
1. Complete React code for the dark-themed application with all integrated features
2. ESP32 firmware + sensor wiring diagram
3. Database setup + API endpoints
4. TensorFlow.js disease detection pipeline
5. Gemini chatbot integration with proposal-only safety

---

## 14. Key Master Prompts Generated (For Reference)

**Video Generation Prompts:** 6 cinematic 10-second agricultural documentary loops for background use (greenhouse aerial, substrate moisture, vertical towers, leaf scan, irrigation pulse, mandi market).

**UI Rebuild Prompt:** Dark theme restoration prompt specifying exact color system (`#0a0a0a`, `#2dd4bf`, `#10b981`), glassmorphism cards, tab bar structure, feature integration points, single-click irrigation flow, confirmation modals, and safety rules.

---

**END OF HANDOFF**

Paste this entire document into your next LLM session. It contains every decision, every constraint, every feature, and the exact visual identity to preserve.


models finding 
model testing 
dataset linkage (cloude base)
further developmen



Here is the complete inventory of every **model** and **agent** in the TerraSub & Solar-Da v3 platform, organized by what you **build** vs what you **use**.

---

## A. MACHINE LEARNING MODELS (What You Build)

### 1. TerraSub MVP — Disease Detection
| Model | Architecture | Runs On | Purpose |
|-------|-------------|---------|---------|
| **Leaf Disease Classifier** | MobileNetV2 fine-tuned on PlantVillage | Browser (TensorFlow.js) | Classifies leaf diseases from farmer phone camera |
| **Confidence Calibrator** | Post-hoc calibration layer | Browser | Ensures confidence scores are accurate before thresholding |

### 2. Solar-Da v3 — Crop Doctor Suite
| Model | Architecture | Runs On | Purpose |
|-------|-------------|---------|---------|
| **Lesion Detector** | YOLOv11 | Server/Edge | Detects and bounds disease lesions on canopy/root images |
| **Disease Classifier** | EfficientNetV3-B3 (or B0) | Server/Edge | Classifies disease type from cropped lesions |
| **Root-Condition Head** | CNN head added to base classifier | Server | Dedicated classifier for root-port images (root rot, browning extent) |
| **Tipburn-vs-Disease Discriminator** | Binary classifier (dedicated model) | Server | Separates tipburn (calcium transport failure) from pathogen diseases — critical because they need opposite responses |
| **Root-Port Quality Gate** | Lightweight CNN | Server/Edge | Checks blur, exposure, framing, root-port visibility before diagnosis |
| **Canopy Quality Gate** | Lightweight CNN | Server/Edge | Checks image quality for canopy scans |

### 3. Solar-Da v3 — Telemetry & Forecasting
| Model | Architecture | Runs On | Purpose |
|-------|-------------|---------|---------|
| **Anomaly Detector** | Time-series anomaly detection (unsupervised) | Server | Flags unusual EC/pH/DO/mass patterns; uptake-ratio residual is the strongest feature |
| **Price Forecaster** | Retargeted forecasting model | Server | CEA crop price prediction with prediction intervals (downside/expected/upside) |

### 4. NOT a Model (Important Distinction)
| Component | What It Actually Is |
|-----------|-------------------|
| **Crop Recommender** | **Transparent heuristic formula** — NOT ML. `score = normalize(price_trend_7d) × 0.5 + climate_fit × 0.3 + substrate_suitability × 0.2`. Must be disclosed as a heuristic, never presented as AI. |

---

## B. AI AGENTS & ASSISTANTS (What You Build)

| Agent | Model Backend | Capabilities | Safety Boundary |
|-------|--------------|--------------|-----------------|
| **Multimodal Assistant** | Gemini API (via in-process gateway) | Text, voice (Indian languages), image, video (keyframes), document parsing (water reports, nutrient labels) | **Proposal-only**. Can inspect status, explain calculations, diagnose images, retrieve protocols, recommend crops, create listings, open tickets. **NEVER executes physical actions.** |
| **Crop Doctor Agent** | YOLOv11 + EfficientNetV3 ensemble | Orchestrates image → quality gate → detection → classification → cross-check with EC/pH history → treatment protocol generation | Abstains and escalates below confidence threshold. Cross-checks deficiency claims against uptake ratio. |
| **Proposal Gateway Agent** | Policy layer + idempotency middleware | Validates every assistant output before it becomes a proposal. Runs red-team prompt-injection tests. | Rejects execution commands embedded in images/documents. Logs adversarial attempts. |

---

## C. CONTROL & AUTOMATION AGENTS (What You Build)

These are deterministic agents/state machines, not ML:

| Agent | Domain | Function |
|-------|--------|----------|
| **Fertigation State Machine** | Solar-Da | `IDLE → PENDING_CONFIRMATION → DOSING → RELEASED → DOSE_COMPLETE`. Human-gated dosing gate. |
| **Irrigation Controller** | Both | Setpoint + deadband + PID on cumulative deficit. TerraSub: moisture threshold pulses. Solar-Da: reservoir level/EC/pH. |
| **Solution Chemistry Engine** | Solar-Da | Calculates dose volume from target delta, current volume, stock concentration. Adaptive gain bounded by observed history. |
| **Replenishment Engine** | Solar-Da | Converts mass loss → volume. Cross-checks against VPD-driven transpiration and reference ET. |
| **Climate Control Engine** | Solar-Da | VPD band → fans/vents/misting. DLI target → supplemental light decision. Solution temp → aeration priority. |
| **Hybrid Power Scheduler** | Solar-Da | Solar-first scheduling. Fixed load-shed order: supplemental lighting → non-critical climate → dosing. **Circulation never shed.** |
| **Data-Quality Engine** | Both | Marks every reading: valid / suspect / stale / missing / implausible / calibration-blocked. Sensor disagreement → data-quality event (never triggers dosing). |
| **Sensor-Fusion Layer** | Both | Computes virtual sensors: VPD, DLI, transpiration rate, solution age, root-zone risk index, nutrient uptake ratio. |
| **Calibration Service** | Both | Tracks probe drift, expiration dates. Autonomy downgrade when calibration overdue. |

---

## D. FIRMWARE / EDGE AGENTS (What You Build — ESP32)

| Agent | Function |
|-------|----------|
| **Telemetry Ingest Agent** | Reads all sensors → POST to backend every 2 min (TerraSub) or configured interval (Solar-Da). Store-and-forward on network loss. |
| **Local Control Loop** | Evaluates thresholds locally. Executes fallback pulse if backend unreachable > 10 min (TerraSub). |
| **Local Interlock Agent** | Mirrors server interlocks exactly: mixing delay, dose ceiling, level floor, min circulation, DO floor, temp ceiling. |
| **Command Validator** | Verifies signed, sequenced, idempotent, non-expired commands. NACKs stale/unsafe commands with reason. |
| **Camera Agent** | Scheduled capture + on-device quality gate (blur/exposure/framing check). |
| **OTA Agent** | Signature-verified updates, staged rollout, A/B rollback capability. |
| **E-Stop Handler** | Hardware E-stop cuts actuator power independently of microcontroller. |

---

## E. 3RD-PARTY MODELS & SERVICES (What You Use, Not Build)

| Service | Provider | Usage |
|---------|----------|-------|
| **Gemini Pro / Flash** | Google | Multimodal assistant backend |
| **MobileNetV2** | Google/TensorFlow | Base architecture for TerraSub disease model (fine-tuned by you) |
| **YOLOv11** | Ultralytics | Base architecture for Solar-Da lesion detection (trained by you) |
| **EfficientNetV3** | Google/Community | Base architecture for Solar-Da classification (trained by you) |
| **TensorFlow.js** | Google | Client-side inference runtime |
| **PlantVillage Dataset** | Open dataset | Training data for TerraSub leaf diseases |
| **Web Speech API** | Browser native | Voice-to-text for assistant input |
| **Agmarknet / data.gov.in** | Government of India | Market price data for crop recommender |
| **Weather API** | OpenWeatherMap or similar | Climate fit scoring |

---

## F. VALIDATION & TESTING AGENTS (What You Build)

| Agent | Purpose |
|-------|---------|
| **Shadow-Mode Harness** | Runs control plane advisory-only beside human operator for a full cycle before any reservoir is trusted at L3 autonomy |
| **Red-Team Suite** | Automated prompt-injection payloads embedded in images/documents that try to trigger dosing. Proves assistant cannot execute. |
| **Regression Test Harness** | Gates ML model updates in CI. Prevents model degradation. |

---

## Summary Table: Build vs Use

| Category | Count | What You Build | What You Use |
|----------|-------|---------------|--------------|
| **ML Models** | 8 | 7 (MobileNetV2-finetuned, YOLOv11, EfficientNetV3, root-head, tipburn-discriminator, 2× quality gates, anomaly detector) | 3 base architectures (MobileNetV2, YOLOv11, EfficientNetV3) |
| **AI Agents** | 3 | 3 (Multimodal Assistant, Crop Doctor Agent, Proposal Gateway) | Gemini API as backend |
| **Control Agents** | 7 | 7 (State machine, irrigation, chemistry, replenishment, climate, power, data-quality) | — |
| **Firmware Agents** | 7 | 7 (Telemetry, control loop, interlocks, command validator, camera, OTA, E-stop) | — |
| **Testing Agents** | 2 | 2 (Shadow-mode, Red-team) | — |

**Total: ~27 distinct agents/models you are building**, plus 3rd-party base architectures and Gemini as the LLM backend.

---

**Want me to detail the training pipeline for any specific model (e.g., how to fine-tune YOLOv11 on your CEA disease dataset, or how to export MobileNetV2 to TensorFlow.js), or the architecture of the Proposal Gateway safety layer?**

Here are all the **ready-to-use pre-trained models** you can download and plug in directly — no training required.

---

## 1. TERRASUB MVP — Browser Disease Detection (TensorFlow.js)

Since TerraSub runs **client-side in the browser**, you need a model in **TensorFlow.js format** (`.json` + `.bin` weight shards).

### Option A: Pre-built TensorFlow.js Model (Easiest)
| Model | Source | Classes | Accuracy | How to Use |
|-------|--------|---------|----------|------------|
| **Plant Disease MobileNetV2** | GitHub + Medium tutorial | 38 (PlantVillage) | ~95% | Full TF.js conversion pipeline already documented |

**Repo:** [rexsimiloluwa Medium tutorial — Part 2](https://rexsimiloluwa.medium.com/building-a-plant-disease-classification-web-app-in-keras-and-tensorflow-js-part-2-deee91b91ce4) 

This tutorial shows exactly how to:
1. Take a pre-trained Keras MobileNetV2 model (already trained on PlantVillage)
2. Convert it to TensorFlow.js using `tensorflowjs_converter`
3. Load it in the browser with `tf.loadLayersModel('model.json')`
4. Run inference on uploaded images

**Conversion command you run once:**
```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=keras mobilenetv2_plant.h5 ./tfjs_model/
```

**In your React app:**
```javascript
import * as tf from '@tensorflow/tfjs';

const model = await tf.loadLayersModel('/models/plant-disease/model.json');
const prediction = model.predict(preprocessedImage);
```

### Option B: Hugging Face → Convert to TF.js
| Model | HF Link | Classes | Notes |
|-------|---------|---------|-------|
| **MobileNetV2 PlantVillage** | [linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification](https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification) | 38 | 95.41% accuracy. PyTorch format — convert to TF.js via ONNX. |
| **Plant Disease MobileNetV2** | [Daksh159/plant-disease-mobilenetv2](https://huggingface.co/Daksh159/plant-disease-mobilenetv2) | 38 | `.pth` file + `class_names.json`. Includes Streamlit demo. |

**Conversion pipeline (one-time script):**
```python
# PyTorch → ONNX → TensorFlow → TF.js
from transformers import AutoModelForImageClassification
import torch
import tf2onnx
import tensorflow as tf

# Load from HF
model = AutoModelForImageClassification.from_pretrained("linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification")

# Export to ONNX → then use onnx-tf to convert to SavedModel
# Then: tensorflowjs_converter --input_format=tf_saved_model ./saved_model ./tfjs_model
```

---

## 2. SOLAR-DA v3 — Server-Side Disease Detection (Python)

For Solar-Da, models run on your **Node.js/Python backend**, so you can use Hugging Face models directly.

### A. Lesion Detection (Bounding Boxes) — YOLOv11

| Model | HF Link | Classes | mAP50 | Params |
|-------|---------|---------|-------|--------|
| **Plant Disease YOLOv11x** | [JK-TK/PlantDiseaseDetection](https://huggingface.co/JK-TK/PlantDiseaseDetection) | 116 diseases | 69.8% | 57M |

**Usage:**
```python
from ultralytics import YOLO
from huggingface_hub import hf_hub_download

# Download model
model_path = hf_hub_download(repo_id="JK-TK/PlantDiseaseDetection", filename="best.pt")

# Load and run
model = YOLO(model_path)
results = model("leaf_image.jpg", conf=0.25)

# Get bounding boxes
for box in results[0].boxes:
    class_id = int(box.cls[0])
    confidence = float(box.conf[0])
    class_name = model.names[class_id]
    x1, y1, x2, y2 = box.xyxy[0]
    print(f"{class_name}: {confidence:.2%} at [{x1}, {y1}, {x2}, {y2}]")
```

**What this gives you:** Red/yellow/green bounding boxes on leaf images — exactly what the Crop Doctor UI needs.

### B. Disease Classification — EfficientNet

| Model | Source | Classes | Accuracy | Format |
|-------|--------|---------|----------|--------|
| **EfficientNetB1 PlantVillage** | [McKlay/plant-disease-type-EfficientNetB1](https://huggingface.co/McKlay/plant-disease-type-EfficientNetB1) | 15 diseases | ~97% | Keras `.weights.h5` + GitHub repo |
| **EfficientNetB4 PlantVillage** | [liriope/PlantDiseaseDetection](https://huggingface.co/liriope/PlantDiseaseDetection) | 38 diseases | 97.66% | PyTorch |
| **5-Crop Disease EfficientNet** | [VisionaryQuant/5_Crop_Disease_Detection](https://huggingface.co/VisionaryQuant/5_Crop_Disease_Detection) | 17 classes (corn, potato, sugarcane, etc.) | — | PyTorch `.pt` |

**Usage (EfficientNetB1 — Keras/TF):**
```python
import tensorflow as tf
import json
from tensorflow.keras.applications.efficientnet import preprocess_input
import numpy as np
from PIL import Image

# Load model
model = tf.keras.Sequential([
    tf.keras.applications.EfficientNetB1(
        weights=None, 
        input_shape=(240, 240, 3),
        include_top=False,
        pooling='avg'
    ),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(15, activation='softmax')
])
model.load_weights('efficientnetb1_plant_final.weights.h5')

# Load class names
with open('class_names.json') as f:
    class_names = json.load(f)

# Predict
img = Image.open("leaf.jpg").resize((240, 240))
img_array = preprocess_input(np.array(img))
prediction = model.predict(np.expand_dims(img_array, axis=0))
predicted_class = class_names[str(np.argmax(prediction))]
confidence = float(np.max(prediction))
```

**GitHub repo with full working code:** [McKlay/plant-disease-type-EfficientNetB1](https://github.com/McKlay/plant-disease-type-EfficientNetB1) 

---

## 3. ROOT CONDITION & TIPBURN — The Hard Truth

**There are NO pre-trained public models** for:
- Root-port root rot / Pythium detection
- Tipburn vs. pathogen disease discrimination
- Root-browning extent segmentation

These are **Solar-Da differentiators** that the spec calls out, but the research community hasn't published open models for them yet.

### Workaround Solutions (No Training Required):

| Problem | Workaround |
|---------|-----------|
| **Tipburn detection** | Use the **general disease classifier** above + a **rule-based cross-check**. Tipburn is driven by VPD and root pressure, not pathogens. In your code: IF (VPD > 2.0 kPa OR EC > target + 20%) AND classifier predicts "calcium deficiency" → flag as tipburn. No ML model needed. |
| **Root rot detection** | Use the **YOLOv11 model** — it detects some root diseases in its 116 classes. For root-port images, run the same model. If confidence is low, **abstain and escalate** (as the spec requires). |
| **Root browning extent** | Use simple **OpenCV color thresholding** on root-port images. Brown pixels / total pixels = browning percentage. No ML needed. |

---

## 4. QUICK-START: Copy-Paste Integration

### For TerraSub (Browser TF.js) — Use this exact pattern:

```bash
# 1. Install converter
npm install -g @tensorflow/tfjs

# 2. Download pre-trained Keras model from HF or use the GitHub repo above
# 3. Convert
tensorflowjs_converter --input_format=keras \
  ./mobilenetv2_plant.h5 \
  ./public/models/plant-disease/

# 4. In your React component:
```

```typescript
// hooks/useDiseaseDetector.ts
import * as tf from '@tensorflow/tfjs';
import { useState, useEffect } from 'react';

export function useDiseaseDetector() {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tf.loadLayersModel('/models/plant-disease/model.json')
      .then(m => { setModel(m); setLoading(false); });
  }, []);

  const predict = async (imageElement: HTMLImageElement) => {
    if (!model) return null;
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .expandDims()
      .div(255.0);
    
    const prediction = model.predict(tensor) as tf.Tensor;
    const values = await prediction.data();
    const maxIndex = values.indexOf(Math.max(...values));
    
    return {
      classIndex: maxIndex,
      confidence: values[maxIndex],
      allProbabilities: Array.from(values)
    };
  };

  return { model, loading, predict };
}
```

### For Solar-Da (Backend Python) — Use this exact pattern:

```python
# api/disease_detector.py
from ultralytics import YOLO
from huggingface_hub import hf_hub_download
from PIL import Image
import torch
from typing import List, Dict

class CropDoctor:
    def __init__(self):
        # Download YOLOv11 once, cache locally
        self.detector_path = hf_hub_download(
            repo_id="JK-TK/PlantDiseaseDetection",
            filename="best.pt"
        )
        self.detector = YOLO(self.detector_path)
        
        # Classifier (optional ensemble)
        # self.classifier = ... load EfficientNet here
        
    def diagnose(self, image_path: str) -> Dict:
        # YOLOv11 detection
        results = self.detector(image_path, conf=0.25)
        
        detections = []
        for box in results[0].boxes:
            detections.append({
                "class": self.detector.names[int(box.cls[0])],
                "confidence": float(box.conf[0]),
                "bbox": [float(x) for x in box.xyxy[0]]
            })
        
        # Abstention logic
        if not detections:
            return {
                "status": "ABSTAIN",
                "reason": "No disease patterns detected",
                "recommendation": "Retake image with better lighting"
            }
        
        best = max(detections, key=lambda x: x["confidence"])
        
        if best["confidence"] < 0.75:
            return {
                "status": "ABSTAIN",
                "confidence": best["confidence"],
                "reason": "Low confidence prediction",
                "recommendation": "Escalate to agronomist"
            }
        
        return {
            "status": "DIAGNOSED",
            "prediction": best["class"],
            "confidence": best["confidence"],
            "detections": detections,
            "model_version": "YOLOv11x-CEA-v1.0"
        }
```

---

## 5. Summary Table: What to Download Right Now

| Feature | Model | Where to Get | Format | Effort |
|---------|-------|-------------|--------|--------|
| **TerraSub leaf disease** | MobileNetV2 PlantVillage | [HF: linkanjarad](https://huggingface.co/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification) or [GitHub tutorial](https://github.com/McKlay/plant-disease-type-EfficientNetB1) | Convert to TF.js | Medium |
| **Solar-Da lesion detection** | YOLOv11x | [HF: JK-TK](https://huggingface.co/JK-TK/PlantDiseaseDetection) | PyTorch `.pt` | Low |
| **Solar-Da classification** | EfficientNetB1 | [HF: McKlay](https://huggingface.co/McKlay/plant-disease-type-EfficientNetB1) | Keras `.h5` | Low |
| **Tipburn discrimination** | Rule-based (VPD + EC cross-check) | Write yourself | Code | Low |
| **Root browning** | OpenCV color threshold | Write yourself | Code | Low |

---

## 6. Important: Model Versioning for the Spec

The spec requires every ML output to carry a **model version**. Since you're using pre-trained models, assign your own version schema:

```typescript
const MODEL_VERSIONS = {
  terrasub_leaf_classifier: "MobileNetV2-PlantVillage-HF-v1.0",
  solarda_lesion_detector: "YOLOv11x-JKTK-HF-v1.0", 
  solarda_disease_classifier: "EfficientNetB1-McKlay-HF-v1.0",
  solarda_tipburn_discriminator: "RuleBased-VPD-EC-v1.0"
};
```

Store this in your database with every `disease_reports` row so the spec's audit trail requirement is met.

---

**Want me to write the complete Node.js API endpoint that downloads the YOLOv11 model on first boot and serves diagnosis requests, or the React component that loads the TF.js model and shows the scanning animation?**

Click the link to view conversation with Kimi AI Assistant https://www.kimi.ai/share/1a043bb3-6072-8858-8000-0000dd004ae4