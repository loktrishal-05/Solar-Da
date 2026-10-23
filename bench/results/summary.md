# Irrigation benchmark (simulation)

AquaCrop-OSPy 3.1.0 twin, tomato on sandy loam, planted 15 Jan; weather: Open-Meteo archive, Chennai, years 2021, 2022, 2023. Replayed/simulated data, not a field trial. Agent forecasts are the archive's actual next-2-day rain (perfect forecast, optimistic).

| Year | Policy | Water (mm) | Events | Stress days | Dry yield (t/ha) |
|---|---|---|---|---|---|
| 2021 | fixed_schedule | 840 | 42 | 0 | 8.75 |
| 2021 | et_controller | 560 | 28 | 0 | 8.73 |
| 2021 | agent | 340 | 17 | 0 | 8.41 |
| 2021 | agent_no_forecast | 340 | 17 | 0 | 8.41 |
| 2022 | fixed_schedule | 840 | 42 | 0 | 8.80 |
| 2022 | et_controller | 520 | 26 | 0 | 8.77 |
| 2022 | agent | 380 | 19 | 0 | 8.48 |
| 2022 | agent_no_forecast | 380 | 19 | 0 | 8.48 |
| 2023 | fixed_schedule | 840 | 42 | 0 | 8.84 |
| 2023 | et_controller | 500 | 25 | 0 | 8.78 |
| 2023 | agent | 300 | 15 | 0 | 8.45 |
| 2023 | agent_no_forecast | 300 | 15 | 0 | 8.45 |

## Paired differences: agent minus each baseline (same year)

| Year | vs | Water (mm) | Water (%) | Stress days | Yield (t/ha) |
|---|---|---|---|---|---|
| 2021 | fixed_schedule | -500 | -59.5% | +0 | -0.34 |
| 2021 | et_controller | -220 | -39.3% | +0 | -0.32 |
| 2022 | fixed_schedule | -460 | -54.8% | +0 | -0.32 |
| 2022 | et_controller | -140 | -26.9% | +0 | -0.29 |
| 2023 | fixed_schedule | -540 | -64.3% | +0 | -0.38 |
| 2023 | et_controller | -200 | -40.0% | +0 | -0.33 |

## Cases where the agent does no better

- 2021 vs fixed_schedule (saves water but loses yield or adds stress)
- 2021 vs et_controller (saves water but loses yield or adds stress)
- 2022 vs fixed_schedule (saves water but loses yield or adds stress)
- 2022 vs et_controller (saves water but loses yield or adds stress)
- 2023 vs fixed_schedule (saves water but loses yield or adds stress)
- 2023 vs et_controller (saves water but loses yield or adds stress)

`agent_no_forecast` is the fault-injected run: the weather feed is down, so the agent cannot hold for rain.

Reproduce: `services/agents/.venv/Scripts/python bench/run_bench.py` (deterministic, no random seed needed).
