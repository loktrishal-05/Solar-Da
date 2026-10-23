# MASTER PROMPT — TerraSub & Solar-Da v3 Agricultural Intelligence Platform

You are building **one platform with two product modes**. Read this entire document before writing any code. It is self-contained — treat it as the complete spec. Where a rule appears in both products, it is a platform invariant, not a coincidence; do not diverge without a stated reason.

---

## 0. Mission and Product Promise

Build a system that makes growing measurable, explainable, and safe to operate.

> Help growers understand what their crop is receiving, identify problems early, act only within safe boundaries, and prove how each harvest was produced.

Two modes, one codebase, shared contracts:

| Mode | What it is | Users | Horizon | Demo/business outcome |
|---|---|---|---|---|
| **TerraSub MVP** | Biodegradable soil-replacement substrate + app for horizontal grow units, moisture-pulse irrigation | Hackathon judges, growers | Hackathon MVP | A substrate-led system that senses, irrigates, diagnoses, explains |
| **Solar-Da v3** | Re-domained control platform for soilless vertical towers fed by bounded nutrient reservoirs | Commercial growers, agronomists, buyers, fleet ops | Phased roadmap | Safe reservoir chemistry control + verifiable traceable harvests |

**TerraSub is not a simplified Solar-Da frontend.** Different growing media, different irrigation semantics (moisture-threshold pulses vs. continuous recirculating flow), different chemistry unit (grow unit vs. reservoir group). Keep this distinction visible in config, APIs, firmware, and safety evaluation — never collapse the two into one implicit model.

**Non-goals (hold the line on these):** this system does not replace agronomists, does not auto-certify crop quality, does not give binding financial/regulatory advice, and never executes a chemical treatment without human confirmation. The marketplace never holds funds. The crop recommender is a transparent heuristic, not a trained model, unless a later release explicitly validates and ships one.

---

## 1. Platform-Wide Architecture Invariants (non-negotiable, apply everywhere)

These are safety and integrity properties, not style preferences. Violating any of these is a defect regardless of what feature work motivated it.

1. **No assistant, model output, retry path, background job, or automated controller may ever directly execute a physical action.** Every actuation passes through the control plane and requires a human confirmation surface the model cannot reach. Tools may only create *proposals*.
2. **Actuator pipeline is fixed:** `tick → plan → actions → interlocks → dispatch → acknowledge → verify → audit`. No alternate path is permitted, ever, for any caller.
3. **Interlocks are veto-only**, evaluated last, re-evaluated at dispatch time, and cannot be bypassed by a user, an assistant, or any internal service.
4. **`packages/engine` stays pure**: no I/O, no DB calls, no live clock reads — time and randomness are injected, always.
5. **Minimum circulation duty is an interlock, not a scheduling preference.** The power scheduler may never shed it, under any load condition.
6. **Nothing is ever dosed inside a mixing delay.** A reading taken before the mixing delay elapses is not a measurement and must not be acted on.
7. **The dosing operation order is fixed:** top up water → mix → read → dose nutrient → mix → read → correct pH → mix → read. This sequence is a safety property, not a default.
8. **Every dose figure and every EC/pH/DO band traces to a sourced knowledge-base value.** An unsourced number is a bug, not a placeholder — it must be visibly flagged "unverified" in the UI, never silently trusted.
9. **Every ML output carries a model version, a confidence score, and an abstain path.** Low-confidence predictions abstain and escalate; they do not guess.
10. **Every user-visible derived number has an explain endpoint** tracing it back to its raw inputs and calculation.
11. **Every record is organization-scoped, timestamped, and every mutation writes an audit-log entry.** Device identity is independent of human user identity.
12. **Commands are signed, sequenced, idempotent, and expiring.** A stale or unsafe command gets NACK'd with a reason, never silently dropped or silently executed. Idempotency is a safety control here (a retried dose command that fires twice puts double the intended stock into a bounded reservoir), not a convenience.
13. **Local firmware interlocks mirror server interlocks exactly**, and a hardware E-stop cuts actuator power independent of the microcontroller — network loss must never mean an unsafe reservoir.

---

## 2. Shared Tech Stack

- **Monorepo:** TypeScript — `packages/engine` (pure domain logic), `packages/contracts` (schemas → generated OpenAPI), `apps/api`, `apps/web`, `prisma/schema.prisma`, `firmware/`.
- **Data:** Postgres + TimescaleDB (hypertables, continuous aggregates, retention policies) for the long-term platform. Supabase (Postgres/Auth/Storage/Realtime) may accelerate the TerraSub hackathon prototype specifically.
- **Messaging/queues:** MQTT ingest with per-device auth and replay protection; Redis + BullMQ for queues and scheduled jobs.
- **Auth:** JWT access tokens with refresh-token rotation for humans; per-device credentials/secrets with replay protection for firmware. RBAC, org-scoped multi-tenancy throughout.
- **Firmware:** ESP32 (needs onboard WiFi — not a plain Arduino Uno).
- **ML:** TensorFlow.js running client-side in-browser for TerraSub disease detection (MobileNetV2 fine-tuned on PlantVillage). No separate model-serving service for the hackathon build.
- **Assistant:** Gemini, behind a single in-process policy-controlled gateway — idempotency-key middleware, retry/backoff, and a policy check on every call.
- **Market data:** Agmarknet / data.gov.in (India's open mandi price dataset) for both products' crop recommenders — free registration, never invent a price, missing data stays missing.
- **Secrets:** environment configuration only, never committed to source control.

---

## 3. PART A — TerraSub MVP

### 3.1 Concept

A biodegradable substrate that replaces soil, grown in open horizontal pipes with pulse-triggered drip irrigation, wrapped in an AI monitoring/advisory app. It reuses the Solar-Da water pump hardware but with **different, simpler control logic**: moisture-threshold-triggered pulses, not continuous recirculating flow (solid organic media holds moisture; it doesn't need what an NFT loop needs).

### 3.2 Substrate formula (exact — do not approximate)

Reference batch: **2 liters**, 1 part ≈ 100 ml.

| Ingredient | Parts | Amount (2L batch) | Role |
|---|---|---|---|
| Hydrated coco coir | 11 | 1,100 ml | Structure, aeration, water retention |
| Mature vermicompost / composted kitchen waste | 5 | 500 ml | Primary nutrients, microbial life |
| Rice husk biochar (fallback: perlite) | 2 | 200 ml | Aeration/drainage |
| Neem cake powder | 1 | 100 ml | Pest deterrent, slow-release nitrogen |
| Bone meal or crushed dry eggshell | ½ | 50 ml | Calcium, phosphorus |
| Gelatin solution | — | 10 g bloomed in 40 ml cold water, dissolved in 150 ml warm (not boiling) water | Nitrogen boost + natural binder |

**Hard sourcing rule:** gelatin/collagen must be **fish- or poultry-derived only**. Never tannery-derived (Tamil Nadu's Vellore–Ranipet belt has ~1.5 million tons of accumulated tannery solid waste with documented chromium contamination). Prohibit tannery-derived gelatin explicitly in the recipe calculator, in copy, and in validation logic — this is a safety line, treat it as a hard constraint, not a content note.

**Prep sequence:** confirm compost is fully matured (dark, crumbly, no visible scraps) → hydrate the coir → bloom and dissolve the gelatin → combine dry ingredients → fold in gelatin solution to a damp-sponge consistency → pack into a jute/coir mesh sleeve → lay into the horizontal gutter.

**Recipe calculator requirements:** scale all quantities by target batch volume; record actual quantities used (not just target); display preparation cautions; enforce the gelatin sourcing rule; support control/benchmark/formula/no-gelatin isolation trial types for validation logging.

### 3.3 Pre-hackathon validation trial

Growth takes weeks — cannot be demoed live. Run 10–14 days ahead:

| Tray | Contents | Proves |
|---|---|---|
| A — Control | Coco coir + water only | Baseline: does the base medium alone support growth |
| B — Benchmark | Commercial cocopeat + diluted balanced NPK | What you're competing against |
| C — Formula | Full mix, with gelatin | The product |
| D — Isolation | Full mix, no gelatin | Whether the collagen is doing anything vs. vermicompost/neem alone |

Seed: methi (fenugreek) — germinates 3–6 days, visible differences by day 7–10. Log every 2–3 days: germination %, height, leaf count, 1–5 leaf-color score, same-angle photo.

### 3.4 Hardware and firmware control loop

- **Board:** ESP32 (WiFi required).
- **Sensors:** capacitive soil moisture probe, EC probe, pH probe, DHT22 (ambient temp/humidity).
- **Actuators:** relay to water pump, small peristaltic dosing pump for fertilizer.
- **Disease input:** farmer's phone camera through the app — not a permanently mounted camera (that's stretch-goal only, explicitly out of scope for MVP).

Control loop, runs every 2 minutes by default:

```
read moisture, ec, ph, temp → POST to backend

if moisture < moisture_threshold_low:
    pump ON for pulse_duration_sec
    log irrigation_event (auto)
    wait cooldown_period

if ec < target_ec_for_current_crop_stage:
    run dosing pump for dose_duration_sec
    log irrigation_event with fertilizer_dose_ml

if backend unreachable > 10 min:
    fall back to one short pulse every 4 hours (local safety fallback)
```

Whether a given moisture/EC event **auto-executes or proposes** depends on the configured autonomy policy for the grow unit — do not hardcode full autonomy.

### 3.5 Sensor honesty rule (enforce in UI copy and API responses)

Cheap conductive NPK sensors are unreliable in complex organic substrate. **Never claim live, precise NPK values.** Present EC and moisture as trend **proxies**, validated against a real lab-tested baseline, not as authoritative nutrient readings.

### 3.6 Software architecture

- **Frontend:** React + Vite + Tailwind CSS.
- **Backend:** Node.js + Express.
- **Data/Auth/Storage/Realtime:** Supabase (Postgres) — dashboard updates via Realtime subscriptions, no manual refresh.
- **Disease detection:** MobileNetV2 fine-tuned on PlantVillage, exported to TensorFlow.js, running client-side in-browser.
- **Crop recommender:** transparent Node.js heuristic (not a trained model):
  `score = normalize(price_trend_7d) × 0.5 + climate_fit_score × 0.3 + substrate_suitability × 0.2`
  Price data from Agmarknet/data.gov.in; climate fit from a weather API. Missing market data stays missing — never interpolate or invent it.
- **Chatbot:** Gemini API, multimodal. Text and image sent directly; voice transcribed client-side via the browser's Web Speech API, then handled as text. **Video and document input are explicitly out of scope for TerraSub MVP.**

### 3.7 Database schema (TerraSub)

```sql
users (id, name, phone, role[farmer|buyer|admin], created_at)
grow_units (id, user_id, label, substrate_batch_id, created_at)
substrate_batches (id, coir_pct, vermicompost_pct, biochar_pct, neem_cake_pct,
                    bone_meal_pct, gelatin_grams, mixed_on, notes)
sensor_readings (id, grow_unit_id, recorded_at, moisture_pct, ec_ms_cm, ph, temp_c)
irrigation_events (id, grow_unit_id, triggered_at, trigger_type[auto|manual],
                    duration_sec, fertilizer_dose_ml)
disease_reports (id, grow_unit_id, user_id, image_url, predicted_class,
                  confidence, cure_steps jsonb, created_at)
crop_recommendations (id, region, crop_name, avg_mandi_price, price_trend_7d,
                       climate_fit_score, generated_at)
chat_messages (id, user_id, session_id, role[user|assistant],
                content_type[text|image|voice], content, created_at)
marketplace_listings (id, user_id, crop_name, quantity_kg, price_per_kg,
                       status[active|sold], created_at)
```

### 3.8 API endpoints (TerraSub)

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/sensors/reading` | ESP32 posts a sensor reading |
| POST | `/api/irrigation/manual` | Manual water/dose trigger |
| GET | `/api/grow-units/:id/readings` | Dashboard data |
| POST | `/api/disease/report` | Log a diagnosis result |
| GET | `/api/crops/recommendations?region=` | Scored crop list |
| POST | `/api/chat` | Proxy a chat turn to Gemini |
| POST | `/api/substrate/batches` | Log a substrate mix |
| GET/POST | `/api/marketplace/listings` | Harvest listings |

### 3.9 Feature priority and build order

| Priority | Feature | Note |
|---|---|---|
| P0 | Irrigation & dosing automation | Direct extension of the control loop |
| P0 | Disease detection from photo | TF.js in-browser — strongest live demo |
| P0 | Substrate recipe calculator | **The actual differentiator** — do not deprioritize |
| P1 | Crop & market recommender | Real Agmarknet data, transparent heuristic |
| P1 | Chatbot — text, image, voice | Video/document explicitly out of scope |
| P2 (stretch) | Decomposition/nutrient-release tracker | Chart over already-logged sensor data |
| P2 (stretch) | Buyer marketplace | Static listing board — not transactional |
| Roadmap only | WhatsApp interface | Mention in pitch; do not build |

**Build order:** DB/auth scaffolding → sensor ingestion + live dashboard (hardware first, it's the riskiest piece) → irrigation automation → disease detection → substrate recipe calculator → crop recommender → chatbot → decomposition tracker/marketplace only if time remains.

**Explicitly out of scope for the MVP:** permanently mounted disease cameras, precise live NPK claims, video/document chatbot input, a real transactional marketplace, a WhatsApp interface.

### 3.10 Environment variables

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `AGMARKNET_API_KEY`, `WEATHER_API_KEY`, `ESP32_DEVICE_SECRET`

### 3.11 Pitch/product honesty checklist

- Never claim live, precise NPK sensing.
- Disclose the crop recommender is a transparent scoring heuristic, not a trained model, if asked.
- Disclose the marketplace is a static demo, if built.
- Lead the pitch with the substrate + recipe calculator, not the sensor dashboard — the dashboard pattern is common to every hydroponics hackathon project; the substrate story is not.

---

## 4. PART B — Solar-Da v3

### 4.1 What this is

A **re-domaining**, not a rewrite, of an existing Solar-Da control-plane codebase (already at Phase 2 of a prior plan): from open-field soil irrigation to soilless vertical tower farming — recirculating nutrient-reservoir NFT/aeroponic towers for greenhouses or tower blocks, growing lettuce, strawberries, herbs, leafy greens, microgreens. **Nothing gets deleted.** Legacy open-field code moves behind a feature flag; existing control-plane tests must remain green throughout M0.

**Why this domain is a better fit than soil:** soil is an unmeasured buffer (you estimate what a plant got); a sealed reservoir is bounded (mass loss = transpiration + evaporation, measured directly). This turns "traceability is a claim" into "traceability is derivable," and turns a season-long feedback loop into 10–12 correctable cycles a year. The trade-off: the control problem gets easier, the safety problem gets sharper — a miscalculated dose in a bounded reservoir can damage a crop in hours, not days. Build every chemistry feature with that asymmetry in mind.

### 4.2 What survives unchanged from the existing codebase

Schemas/contracts; Postgres + TimescaleDB; MQTT device ingest with per-device auth and replay protection; Redis + BullMQ; JWT refresh rotation, RBAC, org-scoped multi-tenancy; structured logging/tracing/health checks; feature flags; the control-plane pipeline (§1.2); the interlock mechanism (only the rule set changes); autonomy levels L0–L4 (meanings revised, §4.7); the full audit trail; the command lifecycle with idempotency keys; the sensor data-quality engine; the calibration service; the sensor-fusion layer; and — most importantly — the fertigation state machine `IDLE → PENDING_CONFIRMATION → DOSING → RELEASED → DOSE_COMPLETE`, which is already the human-gated dosing gate this pivot needs. **Extend it, never duplicate it.**

**Promoted to platform core:** the vertical-tower logic module (decomposes into the solution/replenishment/climate engines below); the tower dashboard (becomes primary, not a tab); the power model (wired to real telemetry, keeps simulation as an explicit forecasting/dry-run mode).

**Re-domained, same code new meaning:** the reference-evapotranspiration engine becomes an independent cross-check against reservoir-mass-loss transpiration (two independent measurements of the same quantity — a data-quality asset); the plot/zone model maps onto the new hierarchy via migration, no orphaned rows; the irrigation controller pattern (setpoint, deadband, PID on cumulative deficit) survives — only the controlled variable changes, from soil moisture to reservoir level/EC/pH.

**Flagged legacy, kept working, hidden by default:** soil moisture probes/tensiometers, drip-line/zone-valve hydraulics, the soil-water-deficit virtual sensor, open-field spray-window logic (the harvest-block *concept* itself survives and moves into the new domain).

### 4.3 Domain model

```
Organization
 └── Site                      (a farm location — greenhouse, rooftop, tower block)
      └── GrowBlock            (a room, bay, or outdoor block)
           └── ReservoirGroup  (one nutrient solution loop — the CHEMISTRY unit)
                ├── Reservoir  (volume, load cell, probe cluster, dosing pumps)
                └── Tower[]    (the PLANTING unit)
                     └── Segment[]        (stacked column sections)
                          └── Port[]      (net-pot position)
                               └── PlantSlot  (occupied by a Batch member, or empty)
```

A `ReservoirGroup` can feed one tower or many on a shared loop — model this from day one, because a shared loop is exactly what makes disease-spread modeling necessary later. A `Batch` spans **ports**, not towers (towers get partially replanted). A closed `Batch` produces a `HarvestLot`.

### 4.4 Sensing per ReservoirGroup

| Signal | Sensor | Why it matters |
|---|---|---|
| EC | Temp-compensated EC probe | Total dissolved salts — primary nutrient proxy |
| pH | 2-point calibrated probe | Nutrient availability; drifts as ions are taken up |
| Dissolved oxygen | DO probe or aeration+temp proxy | Root health — biggest root-rot driver |
| Solution temperature | Inline probe | DO solubility falls, pathogen risk rises, as temp climbs |
| Reservoir mass | Load cell | Mass loss = transpiration + evaporation — key derived signal |
| Level | Ultrasonic/float | Dry-run interlock; cross-checks mass |
| Flow/pressure | Inline meter | Confirms circulation actually happened |
| Air temp + RH | Sensor pair | Drives VPD |
| Light (PAR/PPFD) | Light sensor | DLI accumulation |
| CO₂ | CO₂ sensor | Enclosed greenhouse only |
| Canopy + root-port images | Camera module | Deficiency, disease, root condition |

The data-quality engine marks every reading valid / suspect / stale / missing / implausible / calibration-blocked. **Sensor disagreement generates a data-quality event and must never directly trigger dosing.**

### 4.5 The signature diagnostic — nutrient uptake ratio

Computed from Δ EC against Δ mass. This is the one thing soil farming structurally cannot produce:

- **Mass ↓, EC ↑** → water leaving faster than nutrient → add water, not nutrient
- **Mass ↓, EC ↓** → nutrient uptake outpacing water uptake → add nutrient stock
- **Mass ~flat, EC ↓** → possible leak, dilution, or probe drift → **flag it, do not dose**

Other derived signals: VPD (air temp+RH), DLI (running light integral), transpiration rate (mass loss per interval), solution age (hours since last full change — feeds disease risk), root-zone risk index (temperature + DO + solution age + recent detections).

### 4.6 The engines

- **Solution chemistry:** target EC/pH bands per crop and growth stage, sourced from a knowledge base — unsourced values flagged unverified, never silently trusted. Dose volume = f(target delta, current volume from mass, stock concentration), corrected against observed response. Adaptive gain learns each reservoir's pH-response-per-ml from history, **bounded and never extrapolated past the observed range.** Fixed operation order: top up water → mix → re-read → dose nutrient → mix → re-read → correct pH → mix → re-read.
- **Replenishment:** converts mass loss to volume, cross-checked against both VPD-driven transpiration and reference-ET. Divergence beyond threshold is a **data-quality event, not an automatic action.** Schedules top-ups against water-source availability and the power window.
- **Climate control:** VPD band drives fans/vents/misting; DLI target drives a supplemental-light decision sized to the deficit and gated by power headroom; solution-temperature ceiling drives aeration and is a hard interlock.
- **Hybrid power model:** solar-first scheduling — circulation and light top-up prefer the solar-generation window, battery holds a reserve floor. **Load-shed order is fixed in code:** supplemental lighting sheds first → non-critical climate → dosing. Circulation is never shed below the root-safety minimum — that floor is an interlock, not a scheduling preference.

### 4.7 Safety interlocks

Veto-only, evaluated last, re-evaluated at dispatch, never bypassable by any caller including the assistant:

- Absolute EC ceiling per crop (worst-case volume estimate)
- pH absolute floor/ceiling and max rate-of-change per hour
- Mandatory mixing delay since last dose
- Max cumulative dose per reservoir per 24 hours, per stock
- Low reservoir level/mass blocks dosing and pump start (dry-run protection)
- Solution-temperature ceiling forces aeration priority, blocks heat-adding actions
- Dissolved-oxygen floor makes aeration take precedence over every other actuator
- Minimum circulation duty cycle — never shed by the power scheduler
- Any biocide/sanitizer/biological routes to the fertigation state machine and waits for explicit human confirmation
- A post-treatment harvest block prevents listing creation until it expires
- Manual override / E-stop persists until explicitly cleared

### 4.8 Autonomy levels

| Level | Behavior |
|---|---|
| L0 — Manual | Operator triggers everything |
| L1 — Advisory | System recommends; operator taps to accept |
| L2 — Supervised | Circulation, climate, water top-up run automatically; all chemistry waits |
| L3 — Auto chemistry | Doses nutrient and pH within a pre-approved envelope; sanitizers/biologicals always gated |
| L4 — Full auto | Only for a reservoir with verified flow, in-window calibration, and mass/level agreement — never for a sanitizer |

A reservoir with overdue probe calibration **silently drops from L4 to L3.** Autonomy depends on sensor *trust*, not just sensor presence.

### 4.9 Crop Doctor

Scheduled canopy **and root-port** imaging (roots visible through the net-pot opening — a signal soil farming can't produce; build this first as the differentiator). A quality gate requests a **specific** retake (blur, exposure, framing) rather than guessing on a bad photo. Disease classes: root rot/Pythium, powdery and downy mildew, Botrytis on strawberry, tipburn, fast-onset nutrient deficiencies — each with a sourced treatment protocol. A dedicated **tipburn-vs-disease discriminator** is required: tipburn is a calcium-transport failure driven by VPD and root pressure, not a pathogen — treating it as one wastes a cycle. Deficiency claims are cross-checked against EC/pH history and the uptake ratio; agreement raises confidence, disagreement surfaces both and recommends a tissue test. **Below a confidence threshold, abstain and escalate — never fabricate a diagnosis.** A cure-protocol object bundles: explanation, annotated image, reservoir-specific corrective recipe/dose, isolation/sanitation steps, harvest-block date, follow-up schedule. Because one infected tower on a shared reservoir can seed every tower on that loop, model the blast radius, recommend isolation, and drive a scouting heat map by tower and port. Follow-up images close the loop and log real cure rates per protocol over time.

### 4.10 Multimodal assistant

Accepts text, voice (multiple Indian languages), image, and video (keyframe-extracted, per-timestamp summaries), plus documents — water-test reports and nutrient labels parse into knowledge-base candidates **with a confirmation step before anything is trusted.** Retrieves from both the curated agronomy knowledge base and the farm's own telemetry/dose history/diagnosis records.

Tool calling routes through **one in-process gateway**: idempotency-key middleware, retry/backoff, policy check on every call. Available tools: check reservoir status, explain a dose calculation, diagnose an image, retrieve a cure protocol, recommend crops, **propose** a top-up or dose, create a listing, open a support ticket. **These tools only ever create proposals.**

**The hard boundary (restated, because it is the one rule that cannot slip):** no tool call, model output, or automated path ever executes a physical action. Execution always requires human confirmation in a UI surface the model cannot reach — proven with a red-team suite of prompt-injection payloads embedded in uploaded documents/images that specifically try to trigger dosing. Every answer cites the reading, article, or calculation it's grounded in; an ungrounded dose figure is a bug. An offline SMS/IVR fallback covers `STATUS`, `TOPUP <reservoir>`, `STOP`.

### 4.11 Crop cycle planning

Market data for the CEA crop set (leafy greens, herbs, strawberries, microgreens) from Agmarknet/data.gov.in — same source as TerraSub. Never invent a price; missing stays missing. Forecasts always carry a prediction interval, never a bare number. Suitability scoring weighs: cycle length vs. calendar, DLI requirement vs. available light + supplemental capacity, EC/pH compatibility with other crops sharing the loop, temperature band vs. site climate control, tower-port yield density. **Ranking happens per reservoir group, not per farm**, since incompatible crops can't share one loop's chemistry. Profitability nets cultivation cost (including energy — a real CEA line item field farming lacks) against forecast price → downside/expected/upside cases + break-even yield. Staggered transplant scheduling targets steady weekly harvest volume, not one lump batch.

### 4.12 Marketplace & traceability passport

Roles: grower, aggregator, buyer (retail/restaurant/quick-commerce/processor), logistics, agronomist, admin, with buyer KYC/GST verification. Listings generate from a `HarvestLot` with an auto-attached passport — **append-only, cryptographically chained, never editable text, QR-scannable to a public verification page**, containing every dose, every reading, every treatment, solution source/volume, energy mix, harvest-block compliance. Matching runs on grade/volume/delivery-window/radius/certification through structured offer/counter-offer with expiry, not free-form chat. **Payments sit behind a clean interface with a sandbox implementation — the system never holds buyer or seller funds directly** (in India this crosses into the RBI payment-aggregator regulatory framework); route through a licensed aggregator's escrow/split-settlement product instead. This is a regulatory note, not legal advice — get a lawyer's review before building real payments.

### 4.13 Fleet ops & automation

Background jobs on the existing queue: alert fan-out with severity routing, follow-up-image reminders, buyer-match notifications, nightly price sync, weekly grower reports. Fleet view: reservoirs by deviation severity, towers by occupancy, probes by calibration status, nodes by last-seen. Support tickets carry full reservoir context + in-ticket media. OTA is signature-verified with A/B rollback and staged rollout. Observability tracks ingest lag, control-loop failures, dosing error distribution, queue depth. Season report exports yield-per-port, water/nutrient-per-kg, energy mix, disease events, revenue. **A shadow-mode harness runs the control plane advisory-only for a full cycle beside a human operator — required before any reservoir is trusted at L3.**

### 4.14 Firmware (one node per ReservoirGroup, not per tower)

Probes, load cell, four dosing pumps, a circulation pump, aeration, top-up valve. **Local interlocks mirror the server set exactly** — mixing delay, dose ceiling, level floor, minimum circulation, DO floor, temperature ceiling — because a network outage must never mean an unsafe reservoir. Peristaltic pumps calibrated in ml/second, **re-verified periodically by mass** (a pump drifting 15% doses 15% wrong, silently). Store-and-forward preserves original timestamps; commands signed/sequenced/expiring; stale commands NACK'd with a reason. Camera module handles scheduled canopy/root capture with an on-device quality gate. OTA signature-verified with A/B rollback. Hardware E-stop cuts actuator power independent of the microcontroller.

### 4.15 Database models added beyond what's carried over

```
Site, GrowBlock, ReservoirGroup, Reservoir, Tower, Segment, Port, PlantSlot
Batch, HarvestLot, CropProfile (ecBand, phBand, doFloor, dliTarget, vpdBand, cycleDays)
SolutionReading  (hypertable: ec, ph, do, tempC, massG, levelMm, quality)
DoseEvent        (stock, ml, predictedDelta, achievedDelta, mixDelayMs, confirmationId)
StockSolution, TopUpEvent, FlushEvent, SolutionChangeRecord
CalibrationRecord (standardUsed, drift, expiresAt)
ClimateReading, LightIntegral, EnergyPlan
RootImage, CanopyImage, Detection (rootFlag), CeaDiseaseProfile,
TreatmentProtocol, TreatmentApplication, TreatmentOutcome, HarvestBlock
LoopSpreadEvent
```

Every model: `organizationId`, timestamps, soft delete, audit-log entry on mutation.

### 4.16 API endpoints (Solar-Da additions)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/reservoir-groups/:id/readings` | Ingest solution telemetry |
| POST | `/api/reservoir-groups/:id/proposals` | Create top-up/dose/treatment/isolation proposal |
| POST | `/api/proposals/:id/confirm` | Human-confirm a permitted proposal |
| GET | `/api/reservoir-groups/:id/explain` | Explain current derived signals/recommendations |
| GET | `/api/harvest-lots/:id/passport` | Retrieve public/authorized passport view |

### 4.17 ML track

Disease classifier retrained on the CEA class set with a dedicated root-condition head. Lesion segmenter extended with root-browning extent. Separate tipburn-vs-disease binary discriminator (the two need opposite responses). Quality gate extended with a root-port framing check. Price forecasting retargeted to the CEA crop set. Anomaly detection retargeted to solution telemetry, uptake-ratio residual as the strongest feature. Every model versioned; every prediction stores that version; confidence calibrated with an abstain path; eval harness gates regressions in CI; **never auto-train on grower-submitted images without a curation queue that preserves provenance.**

### 4.18 Phase plan

| Phase | Focus |
|---|---|
| M0 | Reconcile & re-domain — bridge phase, nothing new built, legacy hidden behind a flag |
| M1 | Reservoir & tower sensing fabric — calibration, plausibility rules, virtual sensors |
| M2 | Solution control plane — chemistry engines, interlocks, adaptive gain, digital twin |
| M3 | Climate, aeration & solar-first energy |
| M4 | Crop Doctor — root imaging is the differentiator, build it first |
| M5 | Multimodal assistant |
| M6 | Crop cycle planning & demand |
| M7 | Marketplace & traceability passport |
| M8 | Fleet ops & pilot readiness |

**If a deadline forces a cut, the minimum compelling demo is M0 → M1 → M2 → M4 → M5:** a reservoir that senses, decides, and doses safely; a crop doctor that reads roots; an assistant that explains any of it in the grower's language.

### 4.19 Demo flows that must be perfect (release-blocking)

1. Reading → uptake ratio → dose decision → interlock pass → dose → mixing delay → verified delta → audit row.
2. Root-port photo → diagnosis → reservoir-specific recipe → gated treatment → harvest block → shared-loop isolation list.
3. Cloudy day + low battery → correct load-shed order → circulation never drops below minimum.
4. "What should I grow next in reservoir 3?" → ranked list with loop-compatibility and energy cost → forward buyer match.
5. Regional-language voice question → grounded answer citing today's actual readings → one-tap proposal → human confirmation → execution.
6. Harvest lot → passport → buyer match → order → QR scan showing complete verified input history.
7. **Adversarial:** prompt-injection payload in an uploaded image/document tries to trigger dosing → gateway rejects execution and records the event.
8. **Offline:** network loss → store-and-forward + bounded local safety behavior → stale/duplicated commands rejected.

---

## 5. Cross-Cutting Product Honesty and Safety Rules (both products)

- Never claim precise live NPK measurement in complex organic substrate.
- Always identify the crop recommender as a transparent heuristic unless a validated predictive model explicitly replaces it later.
- Always label marketplace functionality as static/sandbox until real transactional infrastructure exists.
- Never present an unsourced EC/pH/DO/treatment band as authoritative — flag it unverified instead.
- No assistant, model output, retry path, background job, or automated controller may directly execute a physical action outside the control-plane and confirmation boundaries — enforce this in architecture, in code, and prove it with adversarial tests. (Repeated deliberately — this is the platform's single most important invariant.)

---

## 6. Roles and Access (shared RBAC model)

| Role | Needs | Key permissions |
|---|---|---|
| Grower/operator | Monitor crops, respond to alerts, approve proposals, manage batches/harvests | View assigned sites; operate within autonomy policy; confirm safe actions |
| Agronomist | Review diagnoses, protocols, crop plans, treatment outcomes | Add/approve KB candidates; review cases; provide recommendations |
| Buyer | Discover harvests with evidence | View verified listings/passports; submit structured offers |
| Aggregator/logistics | Coordinate volume, grade, delivery, fulfillment | Manage eligible listings and logistics states |
| Admin | Manage orgs, users, policies, models, sources, flags | Org and platform administration; audit access |
| Support operator | Diagnose device/telemetry/control issues | View scoped system context; create/resolve tickets |
| Device/firmware | Report telemetry, receive signed scoped commands | Device-authenticated ingest and command acknowledgement only |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Reliability | Store-and-forward preserves original device timestamps; commands expire; failed actions are observable and auditable |
| Safety | Nothing reaches an actuator except via control plane + interlocks + state machine; minimum circulation is never shed |
| Security | Per-device auth, replay protection, signed commands, RBAC, org isolation, secure secrets, immutable audit history |
| Explainability | Every visible number has an explain endpoint tracing to inputs; every dose has a source and calculation |
| ML governance | Models versioned, confidence-calibrated, regression-tested, able to abstain; user images curated before training |
| Performance | Live dashboards use realtime subscriptions; telemetry in time-series structures with retention/aggregate policies |
| Maintainability | TypeScript monorepo; `packages/engine` pure with injected time, no I/O; shared contracts generate API schemas |
| Recoverability | Firmware OTA signature-verified, staged rollout, A/B rollback; E-stop and local interlocks survive network loss |
| Observability | Track ingest lag, control-loop failures, dose error distribution, queue depth, device last-seen, calibration status, alert delivery |

---

## 8. Definition of Done / Acceptance Criteria by Area

| Area | Success measure |
|---|---|
| Telemetry | Readings ingested with timestamp, device identity, plausibility status, org scope; dashboards update without manual refresh |
| Automation | TerraSub triggers threshold-based pulses; Solar-Da completes water→mix→read→nutrient→mix→read→pH→mix→read with an audit record |
| Safety | Unsafe commands vetoed at dispatch; stale/duplicate/over-limit/low-level/calibration-invalid commands never reach actuators |
| Diagnosis | Poor-quality images request retakes; low-confidence predictions abstain; every prediction records model version + confidence |
| Explainability | Every dose, recommendation, and visible derived number exposes its inputs and calculation/source |
| Demo quality | All Solar-Da demo flows (§4.19) and the TerraSub substrate-led flow complete reliably in a test environment |
| Traceability | A HarvestLot generates a QR-verifiable append-only passport |

---

## 9. Build-Agent Operating Instructions

When implementing against this spec:

1. **Default to reuse.** If a Solar-Da capability already exists in the legacy codebase (control-plane pipeline, interlocks, fertigation state machine, calibration service, sensor-fusion layer, autonomy levels, audit trail, command lifecycle), extend it — do not create a parallel implementation for a "new" domain concept that is really the same mechanism with a new controlled variable.
2. **Never delete legacy code during re-domaining (M0).** Hide it behind a feature flag. Migrations must not orphan rows.
3. **Treat every safety interlock and the fixed operation orders (§1, §4.6, §4.7) as immutable constraints**, even under a demo deadline. If a shortcut is needed, cut a *feature* (see §4.18 minimum path), never a *safety property*.
4. **Treat "propose vs. execute" as a first-class distinction everywhere.** Any new capability — assistant tool, automation rule, background job — defaults to producing a proposal unless the autonomy policy for that resource explicitly and narrowly permits direct execution, and even then only for the operation classes allowed at that autonomy level (never sanitizers/biologicals).
5. **When a number is shown to a user, ask "what is its source and its explain endpoint?" before shipping it.** If there isn't a good answer, it's not ready.
6. **When adding an ML prediction, ask "what does abstention look like here, and what confidence threshold triggers it?"** before shipping it.
7. **Follow the stated build orders** (§3.9 for TerraSub, §4.18 for Solar-Da) rather than reordering for convenience — they're sequenced by demo risk, not by ease of implementation.
8. **Run the adversarial and offline flows (§4.19, items 7–8) as real automated tests**, not just documentation of intent.

---

## 10. Open Decisions (carry forward, don't silently resolve differently)

| Decision | Recommended resolution |
|---|---|
| Shared deployment for both products? | Share contracts/platform services; use explicit product-mode feature flags and separate safety profiles |
| Canonical database stack? | Postgres/TimescaleDB for the long-term platform; Supabase may accelerate the TerraSub prototype only |
| First-class crops? | TerraSub: methi. Solar-Da: lettuce, strawberries, herbs, leafy greens, microgreens |
| Marketplace transactional at launch? | No — listing, matching, passport, and sandbox settlement interfaces only |
| When can L3/L4 be enabled? | Only after shadow mode, calibration trust, interlock tests, and reservoir-specific operational approval |
| First physical pilot? | One ReservoirGroup, one tower, one firmware node, verified sensors, human operator in the loop |

---

*This master prompt consolidates the Product Requirements Document and the Master Reference for TerraSub & Solar-Da v3. It is a product/engineering planning artifact, not agronomic, medical, legal, regulatory, or financial advice.*
