# Decisions

## D1: Theme (2026-10-23)
Conflict: `docs/HANDOFF.md` says dark theme is the consensus; the running app (`App.tsx` -> `Light*` components) and the live site are light.
Decision (provisional, Phase 0): **light is the shipped theme**, because it is what renders and what the live site shows. Dark* components remain in the tree unwired. Owner can reverse this; change `App.tsx` imports.

## D2: Python interpreters and AquaCrop version (2026-10-23)
Test install on Windows 11:
- AquaCrop-OSPy **3.0.10 on CPython 3.10.11: fails on import**. It AOT-compiles with numba on first use and needs an MSVC compiler (`Cannot find suitable msvc`).
- AquaCrop-OSPy **3.1.0 on CPython 3.11.9: imports and runs** the bundled Tunis wheat example (`services/twin/tests/test_aquacrop_smoke.py`).
Decision: both `services/agents` and `services/twin` use CPython 3.11.9 in **separate venvs**; twin pinned to `aquacrop==3.1.0`. Exact pins: `services/*/requirements.lock`. This differs from the blueprint's 3.0.10 / 3.7-3.10 assumption.

## D3: Module owners
Team not confirmed yet. Fill in before Phase 1.

| Module | Owner |
|---|---|
| web (Agent Console, approvals, benchmark page) | TBD |
| api + engine (safety check, envelope rules) | TBD |
| services/agents (replay, LangGraph) | TBD |
| services/twin + bench | TBD |
| services/vision | TBD |
| demo, evidence, slides | TBD |

## D4: Irrigation decision rule (2026-10-24)
Three versions were benchmarked on Chennai 2021-2023 (AquaCrop twin); all runs are kept in `bench/results/`.
- v1 (twin stress days only): ~30-40% less water than the ET controller but ~4% lower yield. Rejected.
- v2 (irrigate if the twin projects >= 0.5% more biomass): more water than the ET controller (e.g. 860 vs 560 mm in
  2021) for the same yield. Rejected.
- v3 (current): FAO-56 deficit trigger shared with the ET baseline, plus rain-forecast hold, plus a twin check that
  lets it wait a day when that costs nothing. No parameter was tuned on the benchmark years.

## D5: Retrieval without embeddings
The advisor uses offline BM25 with phrase/alias boosts and a coverage check over `data/knowledge/`, not
`init_embeddings` + Chroma: no embedding model runs offline on the demo laptop without a download, and the demo must
work with Wi-Fi off. Approved sources are Wikipedia articles (CC BY-SA 4.0, background only) plus the team's
escalation policy. Replace them with extension guides (TNAU, ICAR/KVK) checked by an agronomist before any real use.

## D6: Vision model hosting
Weights are not committed (`*.onnx` is gitignored). The Colab notebook exports `solarda_vision.zip`; it is attached to
a GitHub release and installed with `scripts/fetch_vision_model.ps1`. The browser TF.js model stays as the offline
fallback in Crop Doctor.

Published as release `vision-v1` (2026-10-24). The field gap is large: 98.2% on PlantVillage, 61.0% on PlantDoc. The
abstain threshold (0.93, chosen so accepted field validation predictions reach 90%) refuses 60% of field photos, so
in the field the model mostly says "retake / ask an expert" and is 87% right when it does answer. Treatment always
needs human approval regardless. PlantWild was not evaluated.

## D7: Effects of dispatched actions are simulated
Replayed telemetry cannot react to the agent's actions, so the API returns a simulated plant response (fixed linear
gains, tagged `simulated`) and the ingest node overlays it with a lag. Verify checks that response. This is a known
simplification; the twin covers field irrigation.

## D8: PlantWild evaluation and leaf crop (Phase A)
PlantWild v1 (CC BY-NC-ND 4.0) is used for evaluation only; images stay in `data/raw/` and are never committed or
redistributed. On mapped classes the model gets 44% top-1 in the wild and abstains on 68%. A colour-threshold leaf
crop (`classifier.leaf_crop`) did not help (+0.4 points top-1, slightly lower accuracy when answering), so it is off
by default (`calibration.json` key `leaf_crop`). A segmentation model or fine-tuning on PlantWild-like photos is the
next step if field accuracy matters.

## D9: Harvest and price outlook (blueprint stretch)
Harvest date: AquaCrop-OSPy's tomato uses calendar-day phenology (110 days), so the twin's date forecast cannot beat
the crop calendar; we report yield instead, which the twin forecasts better than the naive mean from day 60. Price:
no Tamil Nadu series was available (2 rows), so the cached series is Bangalore onion (Agmarknet via a CC BY 4.0
compilation). The outlook (last value x damped seasonal ratio, weight tuned on 2016-2018) beats seasonal naive at both
horizons, beats last value only at 4 weeks, and the storage/pooling alert always states the ~28% typical error.
