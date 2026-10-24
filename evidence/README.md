# Evidence for the Round I deck

Every number here comes from a committed file, names its baseline and data, and is a simulation or replay result,
not a field trial. Re-run commands are listed with each.

| Claim | Number | Source file | Re-run |
|---|---|---|---|
| Heatwave and pH-excursion scenarios run end to end at 60x; every dispatched action has a verdict and an audit entry | ph_excursion: 36 runs, 13 dispatched, 7 vetoes (`MAX_DOSE_PER_HOUR`); heatwave: 24 runs, 13 dispatched | `evidence/phase1/live_gate_60x.txt` | `bash scripts/live_gate_phase1.sh` (stack running) |
| A run paused for approval resumes after the agent server is killed and restarted | ventilate dispatched (HTTP 201) after restart | `evidence/phase1/restart_resume.txt` | see `services/agents/tests/test_farm_shift.py` |
| Irrigation water vs rule-based ET controller (Chennai 2021-2023, AquaCrop twin, tomato) | -32%, -19%, -32% water; yield -0.02, 0.00, -0.01 t/ha | `bench/results/summary.md`, `irrigation_results.csv`, `irrigation_benchmark.png` | `services/agents/.venv/Scripts/python bench/run_bench.py` |
| No-gain cases | rain forecast added nothing in all three dry seasons; 2023 vs fixed schedule loses 0.07 t/ha | `bench/results/summary.md` | same |
| Earlier irrigation rules that did not work (kept on purpose) | v1: -4% yield; v2: more water than the ET controller | `bench/results/v1_stress_only/`, `bench/results/v2_biomass_greedy/`, `docs/DECISIONS.md` D4 | |
| Advisor golden set (50 questions, EN + Tamil) | 96% overall; 100% of unsafe/out-of-scope questions escalated | `bench/results/advisor_golden.json` | `bench/eval_advisor.py` |
| Red team (promptfoo 0.124.1): ASI01 goal hijack, ASI02 tool misuse, unsafe dose, Tamil jailbreaks, fake sensor data, PII | 30/30 pass (20 advisor + 10 safety gate); ASI10 verify-loop cap and planted-document cases are pytest tests | `bench/results/redteam/*.json` | `npx promptfoo@0.124.1 eval -c redteam/advisor.yaml` / `safety.yaml` |
| Real data-quality fault caught | EDEN ISS redundant pH probe reads 6.1-12 while primary reads ~6.1; flagged as drift/range and ignored | `services/agents/tests/test_replay_quality.py` | pytest |
| Disease model (EfficientNetV2-B0, fine-tuned in Colab on PlantVillage + PlantDoc train): lab vs field | Lab (PlantVillage test, n=5431): 98.2%. Field (PlantDoc test, n=236): 61.0%; at the 0.93 abstain threshold it refuses 60.2% of field photos and is 87.2% right on the rest. ECE field 0.21 raw, 0.19 after temperature 1.15 | `services/vision/model/metrics.json`, release `vision-v1` | `services/vision/train/train_colab.ipynb` (Colab T4, ~50 min) |
| Disease scenario: blurry photo refused, clear photo diagnosed, treatment waits for a human | 3/3 demo photos correct (94-99%); all 3 blurred copies refused with "retake" | `evidence/phase3/vision_demo_predictions.txt`, `services/agents/tests/test_farm_shift.py` | pytest |

Screenshots for the two screenshot slides (Agent Console mid-scenario with the trace open; Benchmark page) go in
`evidence/screenshots/`.
