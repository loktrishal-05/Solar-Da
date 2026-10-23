# Audit (Phase 0) - 2026-10-23

Method: `npm install`, `npm run build`, `npm run test:engine`, started API (`node weiqou/api/dist/server.js`, :3001) and Vite (:3000), probed every API route with curl. Status: **real** = behaves as described and backed by logic/test; **UI-only** = renders but data is hardcoded or response is canned; **broken** = fails or wrong.

## Build / tooling
| Item | Status | Evidence |
|---|---|---|
| `npm install` | real | succeeds; 5 packages have unreviewed install scripts (prisma, esbuild, core-js) |
| `npm run build` | **broken -> fixed** | root scripts used `apps/api`, `apps/web`; real paths are `weiqou/*` ("No workspaces found"). Fixed in commit "Fix root build workspaces paths"; full build now passes (web bundle 2.2 MB, single chunk) |
| `npm run test:engine` | real | 7/7 pass (interlocks, dosing sequence, gelatin rule, uptake ratio, crop doctor, power scheduler, passport chain) |
| `weiqou/electron` | broken | listed in README and workspaces; directory does not exist. README line corrected |
| Python / LangGraph / agents / replay / twin / vision | missing | not in repo yet (planned Phase 1+) |

## API (Express, in-memory store, no persistence, no auth)
| Route | Status | Evidence |
|---|---|---|
| GET /api/health, GET/POST /mode, POST /estop | real | 200; E-STOP toggles `eStopActive`, visible in /health |
| POST /sensors/reading | real | valid body 200 and creates a pulse proposal; invalid body 400 with Zod errors |
| GET /grow-units/:id/readings, /explain; reservoir-groups/:id/explain | real (seeded data) | 200; data comes from the seeded store, not sensors. Any `:id` returns the same unit |
| POST /reservoir-groups/:id/readings | not probed | - |
| GET /proposals, POST /proposals/:id/confirm | real | confirm with valid role runs interlocks + pipeline -> `DISPATCHED_AND_VERIFIED`. "Dispatch/verify" is simulated in-process, no hardware |
| GET /crops/recommendations, POST /cea/crop-plan | real (seeded prices) | 200 with explain traces; mandi prices are hardcoded |
| POST/GET /substrate/batches | real | tannery gelatin rejected with safety violation |
| GET /power/schedule | real (seeded) | 200; solar/battery numbers are constants |
| GET /harvest-lots/:id/passport | **broken** | API returns `isPassportChainValid:false` for the seeded lot while the engine passport test passes: seed data/hash chain inconsistent. Any `:id` returns the same lot |
| POST /disease/report | **UI-only** | ignores image content: `data:image/png;base64,AAAA` returns HEALTHY at fixed confidence 0.88 |
| POST /chat ("Gemini") | **UI-only** | `gemini.ts` is keyword matching (`dose`, `water`...) plus an injection-phrase blocklist; no LLM call. Injection veto works for the listed phrases only. Request field is `content`, not `userMessage` |
| GET/POST /marketplace/listings | real (in-memory) | 200, lost on restart |

## Safety engine (`packages/engine`)
| Item | Status | Evidence |
|---|---|---|
| Interlocks | real, count differs | `interlocks.ts` has ~12 distinct veto checks (E-stop, expiry, bad telemetry, dry-run level, mixing delay, EC ceiling, pH bounds, human confirmation, L2 autonomy, DO floor...). README/blueprint say 13; not verifiably 13. Tests cover a subset |
| Dosing sequence, gelatin rule, uptake ratio, crop doctor, power scheduler, passport | real | each has a passing test |

## Web (Vite, :3000)
| Item | Status | Evidence |
|---|---|---|
| App shell, Light* sections | real render | `/` returns 200; `main.tsx` renders `App.tsx` which imports only `Light*` components |
| ~50 other components (Dark*, Header, Footer, LiveDashboard, TerraSub/*, SolarDa/* ...) | **UI-only / dead** | not imported by anything reachable from `main.tsx` (grep for imports). Kept, not deleted (rule 5). Note the SolarDa/ and TerraSub/ feature components are among them |
| Alerts and event log in `App.tsx` | **UI-only** | hardcoded arrays (`a1..a3`, `e1..e4`) |
| E-STOP, mode switch | real | `App.tsx` calls `/api/estop` and `/api/mode`; proxied via Vite to :3001 |
| Assistant drawer | UI-only | calls `/api/chat` (keyword mock above). 5 duplicate drawer variants, one used |
| Crop Doctor (TF.js MobileNet, 75% abstain) | **broken until model downloaded** | `public/models/plant-disease/` has only `class_*.json`; `model.json` and shards are gitignored and fetched by `scripts/download_tfjs_model.ps1` / `setup_and_test.bat`. Not verified in-browser in this audit; field accuracy unmeasured (PlantVillage is lab imagery) |

## Hygiene findings
- No real keys found in git history (5 commits scanned for AIza/sk-/ghp_/KEY=...). One placeholder `DEVICE_SECRET = "ESP32_SECRET_KEY_99"` in firmware: replace with config before real use. No `.env` committed.
- No theme in code is consistent with the handoff note (see docs/DECISIONS.md).

## Python stack (added in Phase 0)
| Item | Status | Evidence |
|---|---|---|
| `services/agents` venv (LangGraph 1.2.16, LangChain 1.4.7, FastAPI 0.161.1, uvicorn 0.54.0, Pydantic 2.14.1) | real | installs on CPython 3.11.9; `uvicorn app.main:app` serves `GET /health` 200; `pytest services/agents/tests` passes |
| `services/twin` (AquaCrop-OSPy 3.1.0) | real | smoke test runs a full season; 3.0.10 on 3.10 fails (docs/DECISIONS.md D2) |

## Findings while building Phases 1-4
| Item | Status | Evidence / action |
|---|---|---|
| Fullscreen sections (`App.tsx` `FullscreenSection`) | broken -> fixed | sticky bar used `top-[64px]` inside a container already padded 64 px, leaving a gap and hiding the first row of content; changed to `top-0` |
| Profile menu "All 13 Invariants Verified", hero "ALL 13 INVARIANTS PASS" | UI-only | static text; no check runs. Left in place (rule 5); the Agent Console shows real verdicts |
| Engine interlocks vs agent proposals | extended | `packages/engine/src/agent_safety.ts` maps agent proposals onto the existing `evaluateSafetyInterlocks` and adds the six envelope rules; shared fixtures in `packages/contracts/fixtures/safety_cases.json` |
| EDEN ISS redundant pH probe `ph-tank1_2` | real data fault | reads 6.1-12 while the primary reads ~6.1 (drifts ~0.3 pH/h); ingest flags it and fuses on the primary |
| HydroGrowNet workbook dates | data issue | mixed d/m/Y text, `\`-separated text and Excel datetimes with day/month swapped; `build_slices.py` normalises them |
| HydroGrowNet sampling | read from files | water quality is a portable-meter reading at 10:00 and 14:00 per replicate; air RH/temp/CO2 is hourly |
| Crop Doctor (browser TF.js) after `scripts/download_tfjs_model.ps1` | real, with a performance issue | model loads ("TF.js Model Ready"); clicking a reference sample froze the Chrome renderer for >60 s on this laptop under browser automation (first WebGL inference compiles shaders on the main thread). Not fixed; the server-side vision service is the primary classifier now |
| Crop Doctor first-inference warm-up / CPU fallback | fixed, untested in browser | `useDiseaseDetector.ts` yields with `tf.nextFrame()`, warms up with zeros, disposes tensors, and switches to CPU without reloading if WebGL warm-up throws or exceeds 5 s; exposes `backend` in hook state. The 75% abstain gate is unchanged. Synchronous shader compilation cannot be interrupted, so the initial warm-up may still block before fallback. |
