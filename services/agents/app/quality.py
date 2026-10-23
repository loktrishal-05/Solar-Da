"""Ingest quality checks and sensor fusion: stuck value, out of range, rate of change, dropout, redundancy.

Input: the recent replay window (TelemetryEvent dicts, oldest first). Output: a fused snapshot per zone,
quality flags, and the metrics flagged `bad` (the safety gate vetoes any action that depends on those).
"""
from collections import defaultdict

from .replay.clock import parse_ts

# Plausible physical range per metric; outside it the reading is bad. -9.99 is EDEN ISS's missing sentinel.
RANGES = {
    "air_temp": (-5, 50), "rh": (5, 100), "vpd": (0, 5), "co2": (200, 5000), "par": (0, 2500),
    "ph": (3.5, 8.5), "ec": (0.05, 6), "solution_temp": (5, 40), "level": (0, 200), "soil_moisture": (0, 100),
}
# Largest believable change between consecutive samples (per 5 min); larger is a spike.
MAX_STEP = {"air_temp": 3, "rh": 15, "vpd": 0.8, "ph": 0.5, "ec": 0.5, "solution_temp": 2, "level": 5}
STUCK_SAMPLES = 12  # one hour at 5-minute sampling
# primary -> (backup, max disagreement). Tolerances from the clean EDEN ISS March 2020 slice.
REDUNDANT = {"ph": ("ph_b", 0.4), "ec": ("ec_b", 0.25), "air_temp": ("air_temp_b", 2.5)}
SENTINEL = -9.99


def _flag(flags, zone, metric, check, severity, detail):
    flags.append({"zone": zone, "metric": metric, "check": check, "severity": severity, "detail": detail})


def check_window(events: list[dict], now: str, interval_min: int = 5, drift_hours: float = 4) -> dict:
    """`events` should cover ~24 h: backups are judged on their whole history, drift on the last `drift_hours`."""
    series: dict[tuple, list[dict]] = defaultdict(list)
    for e in events:
        if e["ts"] <= now:
            series[(e["zone"], e["metric"])].append(e)

    flags: list[dict] = []
    latest: dict[str, dict] = defaultdict(dict)
    nowd = parse_ts(now)
    for (zone, metric), s in series.items():
        last = s[-1]
        base = metric.removesuffix("_b")
        v = last["value"]
        bad = False
        age_min = (nowd - parse_ts(last["ts"])).total_seconds() / 60
        if age_min > 3 * interval_min:
            _flag(flags, zone, metric, "dropout", "bad", f"no reading for {age_min:.0f} min")
            bad = True
        lo, hi = RANGES.get(base, (float("-inf"), float("inf")))
        if v == SENTINEL or not lo <= v <= hi:
            _flag(flags, zone, metric, "range", "bad", f"{v} outside plausible [{lo}, {hi}]")
            bad = True
        if len(s) >= 2 and base in MAX_STEP and abs(v - s[-2]["value"]) > MAX_STEP[base] * max(1, interval_min / 5):
            _flag(flags, zone, metric, "rate_of_change", "bad", f"jump {s[-2]['value']} -> {v}")
            bad = True
        # A backup probe that failed the range check anywhere in the window is not trusted for fusion.
        if metric.endswith("_b") and any(x["value"] == SENTINEL or not lo <= x["value"] <= hi for x in s):
            bad = True
        latest[zone][metric] = {"value": v, "unit": last["unit"], "ts": last["ts"], "source": last["source"],
                                "id": f"tel:{zone}:{metric}:{last['ts']}", "bad": bad,
                                "recent": [x["value"] for x in s[-STUCK_SAMPLES:]],
                                "first": next(x["value"] for x in s if (nowd - parse_ts(x["ts"])).total_seconds() <= drift_hours * 3600)}

    # Redundancy: fuse primary and backup. Use the one that is good; if both good but disagreeing, trust neither.
    for zone, metrics in latest.items():
        for primary, (backup, tol) in REDUNDANT.items():
            a, b = metrics.get(primary), metrics.get(backup)
            if not a or not b or a["bad"] or b["bad"]:
                continue
            # Stuck: the primary is frozen while its partner keeps moving. (A flat reading alone is not a
            # fault: EDEN ISS climate is controlled so tightly that temperature sits at 21.00 for hours.)
            if (len(a["recent"]) == STUCK_SAMPLES and len(set(a["recent"])) == 1
                    and abs(b["recent"][-1] - b["recent"][0]) > tol / 2):  # a trend in the partner, not a blip
                _flag(flags, zone, primary, "stuck", "bad",
                      f"{primary} frozen at {a['value']} for {STUCK_SAMPLES} samples while {backup} moved")
                a["bad"] = True
                continue
            if abs(a["value"] - b["value"]) > tol:
                # A real change in the solution/air moves both probes; the probe that moved alone is drifting.
                da, db = abs(a["value"] - a["first"]), abs(b["value"] - b["first"])
                if db - da > tol:
                    _flag(flags, zone, backup, "drift", "bad", f"{backup} moved {db:.2f} while {primary} moved {da:.2f}")
                    continue
                culprit = "drift" if da - db > tol else "redundancy"
                _flag(flags, zone, primary, culprit, "bad",
                      f"{primary} {a['value']} vs {backup} {b['value']} differ by more than {tol}")
                a["bad"] = True

    snapshot = {z: {m: {k: x for k, x in r.items() if k not in ("recent", "first")} for m, r in ms.items() if not m.endswith("_b")}
                for z, ms in latest.items()}
    bad_metrics = {z: sorted({f["metric"] for f in flags if f["zone"] == z and f["severity"] == "bad"
                              and not f["metric"].endswith("_b")}) for z in latest}
    return {"snapshot": snapshot, "quality_flags": flags, "bad_metrics": {z: m for z, m in bad_metrics.items() if m}}
