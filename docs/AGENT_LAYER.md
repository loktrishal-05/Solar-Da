# Agent layer: how it fits together

Built from `docs/BLUEPRINT.md`. Every sensor value is replayed, simulated or from the twin, and is tagged so.

## Services

| Service | Port | Stack | Role |
|---|---|---|---|
| `weiqou/api` | 3001 | Express + `packages/engine` | Existing API plus `POST /api/safety/check`, `POST /api/actions` (Idempotency-Key), `GET /api/audit` (append-only JSONL). The only place safety is decided. |
| `services/agents` | 8000 | FastAPI, LangGraph 1.2, LangChain 1.4 | Replay layer, farm-shift graph, advisor graph, SSE stream. Python 3.11 venv. |
| `services/twin` | 8100 | FastAPI, AquaCrop-OSPy 3.1.0 | `POST /twin/run`, `POST /twin/options`. Separate venv. |
| `services/vision` | 8200 | FastAPI, onnxruntime | `POST /vision/classify` (calibrated, abstains). Model from `scripts/fetch_vision_model.ps1`. |
| `weiqou/web` | 3000 | Vite/React | Agent Console (replay controls, live feed, trace, approvals, E-STOP), Farmer advisor, Benchmark. `/agents/*` is proxied to :8000. |

Start everything: `powershell -File scripts/start_all.ps1`; stop: `scripts/stop_all.ps1`.

## Triggers (`services/agents/app/triggers.py`)

Runs start on events, not only on a clock. Every 5 sim minutes the trigger engine checks the replay window:
`threshold` (a reading crosses a planner target; re-fires hourly while out), `quality_fault`, `forecast_breach`
(learned forecaster, central forecast), `anomaly` (learned detector), `photo`, `weather` (rain ahead of a field bed),
`manual` (`POST /replay/trigger`, the console's Check now), and `schedule` (the scenario tick, kept as a heartbeat).
Keys `(kind, zone, metric)` have cooldowns; at most 6 triggered runs per sim hour (photo, manual and quality faults
are never dropped). Triggers that fire together share one run; the run's state, ingest trace and audit entry record
them, and the console shows them in a Triggers panel. `runner.run_scenario_triggered` is the deterministic version.

## Farm-shift graph (`services/agents/app/graphs/farm_shift.py`)

`ingest -> assess -> [irrigation | fertigation | climate | disease] (parallel Send) -> arbiter -> safety_gate ->
human_approval (interrupt) -> dispatch -> verify (<= 2 retries, then escalate) -> audit`

- **ingest**: replay window (24 h) + fault injector + quality checks (range, rate of change, dropout, stuck and drift
  via redundant probes) + simulated effects of earlier actions; field beds get soil water from the twin.
  Learned sensor models (`app/sensor_models.py`, release `sensor-models-v1`) add a 30 min / 2 h forecast with a
  10-90% band and an anomaly score per stream (`model_signals`); field beds also get a 1-3 day soil-water forecast.
  Model anomalies are `warn` flags (never vetoes); likely limit crossings become issues and early proposals.
- **assess**: rules by default; LLM structured output when `SOLARDA_LLM=1` and a key is set (falls back on any error).
- **specialists**: rules-only (`app/specialists.py`); irrigation uses the twin (`app/irrigation.py`); disease calls
  the vision service and the approved-source retriever.
- **safety_gate**: `POST /api/safety/check`; fails closed (every proposal vetoed) if the API is unreachable.
- **human_approval**: `interrupt()`; resumed by `POST /runs/{id}/resume`; survives a restart (SQLite checkpointer
  in `data/runtime/checkpoints.sqlite`).
- **dispatch**: idempotency key = action id, so a resumed run never repeats an action.
- **audit**: append-only log entry with an English and Tamil summary.

## Safety envelope (`packages/engine/src/agent_safety.ts`)
Existing interlocks (E-STOP, expiry, invalid telemetry, dry-run level, mixing delay, 24 h dose, EC ceiling, pH bounds,
solution temperature, DO floor) plus: max irrigation per zone per day and minimum gap; max dose per hour; no action on
a reading flagged bad; rain hold; treatment always needs a human; E-STOP freezes dispatch; pH dose must move toward
the window; implausible readings are vetoed. Envelope numbers are placeholders marked UNVERIFIED until an agronomist
sources them from the crop and substrate recipes.

## Autonomy tiers
`advise` (L0, no actions), `propose` (L1, a human approves each), `auto_in_envelope` (L2). L3 is roadmap only.

## Tests
- `npm run test:engine` (engine incl. shared safety fixtures), `npm test -w @terrasub-solarda/api`,
  `npm test -w @terrasub-solarda/contracts`
- `services/agents`: `.venv/Scripts/python -m pytest -q` (starts the API, twin and vision services itself)
- `services/twin`, `services/vision`: `.venv/Scripts/python -m pytest -q`
- Red team: `npx promptfoo@0.124.1 eval -c redteam/advisor.yaml` and `-c redteam/safety.yaml` (stack running)
- Benchmark: `services/agents/.venv/Scripts/python bench/run_bench.py`, `bench/eval_advisor.py`
