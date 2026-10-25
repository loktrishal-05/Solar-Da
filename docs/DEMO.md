# Demo script (Round II)

Laptop with Wi-Fi off. Start (Docker Desktop running): `powershell -ExecutionPolicy Bypass -File scripts/demo.ps1`; it opens
http://localhost:3000, click **Agent Console**. Every run starts from fresh state; stop with `scripts/demo.ps1 -Stop`.
Without Docker: `scripts/start_all.ps1` (see README), reset with `scripts/stop_all.ps1` and delete `data/runtime/`.

## 5-minute path
1. **Replay badge.** Point at the amber "Replay mode" bar: no live sensors; EDEN ISS 2020 (an Antarctic research
   greenhouse, used for sensor shape only), HydroGrowNet, Open-Meteo Chennai archive, AquaCrop twin. Every reading
   shows its source tag (replay / simulated / twin).
2. **Irrigation agent.** Scenario `chennai_field_irrigation`, speed 1440x, tier L2. Open a run in the trace: the
   arbiter row shows ET0, the root-zone deficit, the three twin options (hold / irrigate now / irrigate tonight) with
   stress days, biomass and run ids, then the safety verdict. On 16 March it holds for forecast rain.
3. **Stuck sensor.** Scenario `heatwave` (60x): explain the fault injector; or `sensor_drift` where ingest flags EC
   `drift` and the agent declines to dose (the flag is in the ingest row).
4. **Veto.** Scenario `ph_excursion` at 60x: the agent keeps dosing pH down before the last dose has shown; the
   safety gate vetoes with `MAX_DOSE_PER_HOUR`. Also point at the real broken probe `ph_b` being ignored.
5. **Approval.** Switch tier to L1 (propose) and start `heatwave`: runs pause in the Approvals inbox; approve one
   (phone view works: same URL on the phone over LAN) and the run resumes and dispatches.
6. **Disease.** Scenario `diseased_leaf_rain`: the blurry photo is refused ("retake"), the clear one is classified
   with calibrated confidence and a treatment proposal waits for a human, with a re-scan date.
7. **Tamil advisor.** Farmer advisor tab, தமிழ்: ask "தக்காளிக்கு எத்தனை மில்லி பூச்சிக்கொல்லி மருந்து தெளிக்க
   வேண்டும்?" -> escalated, in Tamil. Then "தக்காளி மஞ்சள் இலை சுருள் வைரஸ் என்ன?" -> answered with a citation.
8. **Benchmark.** Benchmark tab: water/yield vs fixed schedule and ET controller for 2021-2023, the no-gain list
   (forecast added nothing in the dry season) and the caveat that the twin is both advisor and judge. Then replay a
   past decision: `GET /agents/runs/{run_id}/history` lists every checkpoint.

## 2-minute fallback (steps 2, 4, 5, 8)
If anything fails, play `evidence/demo_fallback.mp4` (record it after the first full rehearsal).

## Likely questions
- *Is any of this field data?* No. Replayed public datasets, simulated effects and the AquaCrop twin; the UI labels
  each value. A field pilot is the next step.
- *What does the LLM do?* Nothing safety-critical. It is off by default; when on, it ranks issues and phrases
  answers. Proposals are validated objects; the TypeScript engine decides.
- *Why trust the savings?* Don't, yet: see the caveats on the Benchmark page (shared twin, perfect forecast).
- *Disease model accuracy in the field?* See the lab vs field numbers on the Benchmark page; the model abstains below
  its calibrated threshold.
