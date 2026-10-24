"""Event-triggered runs vs the fixed tick: reaction time and number of graph runs per scenario.

Event = first 5-min sample where the condition becomes detectable in the (faulted) replay data:
  heatwave: air temp > 26 C; ph_excursion: pH > 6.4; sensor_drift: the quality checks flag tank1 EC.
Reaction = sim time of the first run whose plan holds the expected response (ventilate / dose_ph) or, for the
drift, whose ingest marks EC unusable. Needs the API on :3001 (scripts/start_all.ps1).
Run: services/agents/.venv/Scripts/python -I bench/eval_triggers.py  ->  bench/results/triggers.json
"""
import json
import sys
from datetime import timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import quality, runner  # noqa: E402
from app.replay.adapters import load_events  # noqa: E402
from app.replay.clock import fmt_ts, parse_ts  # noqa: E402
from app.replay.faults import apply_faults  # noqa: E402
from app.replay.scenario import load_scenario  # noqa: E402

CASES = {
    "heatwave": {"metric": ("feg", "air_temp"), "above": 26.0, "kind": "ventilate"},
    "ph_excursion": {"metric": ("tank1", "ph"), "above": 6.4, "kind": "dose_ph"},
    "sensor_drift": {"flag": ("tank1", "ec")},
}


def event_time(name: str, case: dict) -> str | None:
    sc = load_scenario(name)
    ev = apply_faults(load_events(sc["dataset"], sc["start"], sc["end"]), sc["faults"])
    t, end = parse_ts(sc["start"]), parse_ts(sc["end"])
    while t < end:
        now = fmt_ts(t)
        if "flag" in case:
            win = [e for e in ev if fmt_ts(t - timedelta(hours=24)) <= e["ts"] <= now]
            if case["flag"][1] in quality.check_window(win, now, 5)["bad_metrics"].get(case["flag"][0], []):
                return now
        else:
            zone, metric = case["metric"]
            v = [e["value"] for e in ev if e["ts"] == now and e["zone"] == zone and e["metric"] == metric]
            if v and v[0] > case["above"]:
                return now
        t += timedelta(minutes=5)
    return None


def reaction(runs: list[dict], case: dict, after: str) -> str | None:
    for v in runs:
        if v["sim_time"] < after:
            continue
        if "flag" in case:
            if case["flag"][1] in (v.get("bad_metrics") or {}).get(case["flag"][0], []):
                return v["sim_time"]
        elif any(p["kind"] == case["kind"] for p in v.get("plan", [])):
            return v["sim_time"]
    return None


def minutes(a, b):
    return None if a is None or b is None else (parse_ts(b) - parse_ts(a)).total_seconds() / 60


def main():
    out = {}
    for name, case in CASES.items():
        ev = event_time(name, case)
        modes = {"fixed_tick": runner.run_scenario_headless(name),
                 "triggered": runner.run_scenario_triggered(name)["runs"],
                 "triggered_6h_heartbeat": runner.run_scenario_triggered(name, heartbeat_minutes=360)["runs"]}
        out[name] = {"event_at": ev, "tick_minutes": load_scenario(name)["tick_minutes"]}
        for mode, runs in modes.items():
            r = reaction(runs, case, ev) if ev else None
            out[name][mode] = {"graph_runs": len(runs), "reacted_at": r, "reaction_minutes": minutes(ev, r)}
        print(name, json.dumps(out[name]), flush=True)
    res = {"method": "5-min trigger checks vs the scenario's fixed tick; same graph, same safety gate", "results": out,
           "no_gain": [f"{n}: triggered {r['triggered']['reaction_minutes']} min vs fixed {r['fixed_tick']['reaction_minutes']} min"
                       for n, r in out.items() if (r["triggered"]["reaction_minutes"] or 0) >= (r["fixed_tick"]["reaction_minutes"] or 0)]}
    (ROOT / "bench" / "results" / "triggers.json").write_text(json.dumps(res, indent=1))
    print("no gain:", res["no_gain"])


if __name__ == "__main__":
    main()
