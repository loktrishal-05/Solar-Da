"""Irrigation benchmark: agent vs fixed schedule vs rule-based ET controller, on identical weather years.

    services/agents/.venv/Scripts/python bench/run_bench.py      (starts the twin service itself)

Everything is a simulation: AquaCrop-OSPy twin + Open-Meteo Chennai archive (2021-2023), tomato on sandy loam,
planted 15 Jan each year. No randomness: the same inputs give the same numbers. Results go to bench/results/.
"""
import csv
import os
import subprocess
import sys
import time
from datetime import date, timedelta
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import irrigation  # noqa: E402

YEARS = (2021, 2022, 2023)
SEASON_DAYS = 125
FIXED_EVERY_DAYS, FIXED_MM = 3, 20.0
OUT = ROOT / "bench" / "results"


def season_eval(planting: str, history: list[dict]) -> dict:
    end = (date.fromisoformat(planting) + timedelta(days=SEASON_DAYS)).isoformat()
    r = httpx.post(f"{irrigation.TWIN}/twin/run", json={"planting": planting, "until": end, "irrigation": history},
                   timeout=60).json()
    return {"water_mm": sum(h["mm"] for h in history), "events": len(history),
            "stress_days": r["stress_days"], "dry_yield_t_ha": r["season_dry_yield_t_ha"]}


def run_policy(policy: str, year: int) -> dict:
    planting = f"{year}-01-15"
    p = date.fromisoformat(planting)
    history: list[dict] = []
    et = irrigation.EtController(planting)
    for d in range(SEASON_DAYS):
        today = (p + timedelta(days=d)).isoformat()
        mm = 0.0
        if policy == "fixed_schedule":
            mm = FIXED_MM if d % FIXED_EVERY_DAYS == 0 else 0.0
        elif policy == "et_controller":
            mm = et.step(today)
        elif policy in ("agent", "agent_no_forecast"):
            dec = irrigation.agent_decide(planting, today, history, use_forecast=(policy == "agent"))
            if dec["option"] == "irrigate_now":
                mm = dec["depth_mm"]
            elif dec["option"] == "irrigate_tonight":  # applied at the start of the next day
                history.append({"date": (p + timedelta(days=d + 1)).isoformat(), "mm": dec["depth_mm"]})
        if mm:
            history.append({"date": today, "mm": mm})
    return {"policy": policy, "year": year, **season_eval(planting, history)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    if "--summary-only" in sys.argv:  # rebuild summary/chart from the CSV without re-running the season
        with open(OUT / "irrigation_results.csv", newline="") as f:
            rows = [{**r, "year": int(r["year"]), "water_mm": float(r["water_mm"]), "events": int(r["events"]),
                     "stress_days": int(r["stress_days"]), "dry_yield_t_ha": float(r["dry_yield_t_ha"])}
                    for r in csv.DictReader(f)]
        write_summary(rows)
        write_chart(rows)
        return
    twin = None
    try:
        httpx.get(f"{irrigation.TWIN}/health", timeout=2)
    except httpx.HTTPError:
        py = ROOT / "services" / "twin" / ".venv" / "Scripts" / "python.exe"
        twin = subprocess.Popen([str(py), "-m", "uvicorn", "app.main:app", "--port", "8100"], cwd=ROOT / "services" / "twin",
                                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(60):
            try:
                httpx.get(f"{irrigation.TWIN}/health", timeout=2)
                break
            except httpx.HTTPError:
                time.sleep(0.5)
    try:
        rows = []
        for year in YEARS:
            for policy in ("fixed_schedule", "et_controller", "agent", "agent_no_forecast"):
                t = time.time()
                r = run_policy(policy, year)
                rows.append(r)
                print(f"{year} {policy:18s} water {r['water_mm']:6.0f} mm  stress {r['stress_days']:3d} d  "
                      f"yield {r['dry_yield_t_ha']:.2f} t/ha  ({time.time() - t:.0f}s)", flush=True)
    finally:
        if twin:
            twin.terminate()

    with open(OUT / "irrigation_results.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    write_summary(rows)
    write_chart(rows)


def write_summary(rows):
    by = {(r["policy"], r["year"]): r for r in rows}
    lines = ["# Irrigation benchmark (simulation)", "",
             "AquaCrop-OSPy 3.1.0 twin, tomato on sandy loam, planted 15 Jan; weather: Open-Meteo archive, Chennai, "
             f"years {', '.join(map(str, YEARS))}. Replayed/simulated data, not a field trial. Agent forecasts are the "
             "archive's actual next-2-day rain (perfect forecast, optimistic).", "",
             "| Year | Policy | Water (mm) | Events | Stress days | Dry yield (t/ha) |", "|---|---|---|---|---|---|"]
    for r in rows:
        lines.append(f"| {r['year']} | {r['policy']} | {r['water_mm']:.0f} | {r['events']} | {r['stress_days']} | {r['dry_yield_t_ha']:.2f} |")
    lines += ["", "## Paired differences: agent minus each baseline (same year)", "",
              "| Year | vs | Water (mm) | Water (%) | Stress days | Yield (t/ha) |", "|---|---|---|---|---|---|"]
    no_gain = []
    for y in YEARS:
        a = by[("agent", y)]
        for base in ("fixed_schedule", "et_controller"):
            b = by[(base, y)]
            dw = a["water_mm"] - b["water_mm"]
            pct = 100 * dw / b["water_mm"] if b["water_mm"] else float("nan")
            ds, dy = a["stress_days"] - b["stress_days"], a["dry_yield_t_ha"] - b["dry_yield_t_ha"]
            lines.append(f"| {y} | {base} | {dw:+.0f} | {pct:+.1f}% | {ds:+d} | {dy:+.2f} |")
            if dw >= 0 and ds >= 0 and dy <= 0:
                no_gain.append(f"{y} vs {base}")
            elif dy < -0.05 or ds > 0:
                no_gain.append(f"{y} vs {base} (saves water but loses yield or adds stress)")
    for y in YEARS:
        a, nf = by[("agent", y)], by[("agent_no_forecast", y)]
        if (a["water_mm"], a["dry_yield_t_ha"]) == (nf["water_mm"], nf["dry_yield_t_ha"]):
            no_gain.append(f"{y}: the rain forecast added nothing (agent == agent_no_forecast); in this Jan-May dry season "
                           "no forecast rain coincided with an irrigation trigger")
    lines += ["", "## Cases where the agent does no better", ""]
    lines += [f"- {c}" for c in no_gain] or ["- none in this run; treat that with suspicion and check the baselines"]
    lines += ["", "## Read these numbers with care", "",
              "- The agent asks the same AquaCrop twin that scores the season whether it can wait a day. The judge and "
              "the advisor share a model, so these savings are an upper bound; a field trial or a different crop model "
              "is needed before any claim.",
              "- Savings far above the 8-14% that published advisory trials report against strong baselines are a warning "
              "sign (blueprint, reporting rule 1). Here the gap comes from the agent waiting whenever the twin says the "
              "crop will not lose biomass, which the ET controller (fixed 30 mm trigger) cannot do.",
              "- The stress-day metric (transpiration < 90% of potential) stays at 0 for every policy, so yield is the "
              "meaningful outcome.",
              "- Forecasts are perfect (archive actuals): optimistic."]
    lines += ["", "`agent_no_forecast` is the fault-injected run: the weather feed is down, so the agent cannot hold for rain.",
              "", "Reproduce: `services/agents/.venv/Scripts/python bench/run_bench.py` (deterministic, no random seed needed)."]
    (OUT / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines))


def write_chart(rows):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return
    policies = ["fixed_schedule", "et_controller", "agent", "agent_no_forecast"]
    fig, axes = plt.subplots(1, 3, figsize=(12, 3.6))
    for ax, key, title in zip(axes, ("water_mm", "stress_days", "dry_yield_t_ha"),
                              ("Irrigation water (mm)", "Water-stress days", "Dry yield (t/ha)")):
        for i, p in enumerate(policies):
            vals = [r[key] for r in rows if r["policy"] == p]
            ax.bar([x + i * 0.2 for x in range(len(YEARS))], vals, width=0.2, label=p)
        ax.set_xticks([x + 0.3 for x in range(len(YEARS))], [str(y) for y in YEARS])
        ax.set_title(title, fontsize=10)
    axes[0].legend(fontsize=7)
    fig.suptitle("Simulation: AquaCrop twin + Open-Meteo Chennai archive (not a field trial)", fontsize=9)
    fig.tight_layout()
    fig.savefig(OUT / "irrigation_benchmark.png", dpi=130)


if __name__ == "__main__":
    main()
