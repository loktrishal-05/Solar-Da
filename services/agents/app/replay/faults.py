"""Fault injector: layers faults onto a replay stream on the schedule in a scenario file.

Sensor faults (the reading is wrong, the plant is not): stuck, drift, dropout, spike.
Plant/equipment events (the plant really changes): offset (e.g. heatwave, pH excursion), pump_failure.
Any value this module alters is re-tagged source="simulated" so it is never shown as replayed data.
"""
from .clock import parse_ts


PLANT_EVENTS = ("offset", "pump_failure")


def _in(f: dict, e: dict) -> bool:
    # A plant event (the plant really changes) shows on every probe of that quantity, incl. the redundant `_b`;
    # a sensor fault hits only the named probe.
    metric_ok = e["metric"] == f["metric"] or (f["type"] in PLANT_EVENTS and e["metric"] == f["metric"] + "_b")
    return e["zone"] == f["zone"] and metric_ok and f["start"] <= e["ts"] < f.get("end", "9999")


def _hours(f: dict, e: dict) -> float:
    return (parse_ts(e["ts"]) - parse_ts(f["start"])).total_seconds() / 3600


def apply_faults(events: list[dict], faults: list[dict]) -> list[dict]:
    out = []
    stuck_value: dict[int, float] = {}
    # Plant events first, then sensor faults on top (a stuck probe freezes while the plant keeps changing).
    faults = sorted(faults, key=lambda f: f["type"] not in PLANT_EVENTS)
    for e in events:
        e = dict(e)
        drop = False
        for i, f in enumerate(faults):
            if f["type"] == "pump_failure" or not _in(f, e):
                continue
            t = f["type"]
            if t == "dropout":
                drop = True
            elif t == "stuck":
                e["value"] = stuck_value.setdefault(i, e["value"])
            elif t == "drift":
                e["value"] = round(e["value"] + f["rate_per_hour"] * _hours(f, e), 4)
            elif t == "spike":
                if int(_hours(f, e) * 60) % f.get("every_min", 60) == 0:
                    e["value"] = round(e["value"] + f["magnitude"], 4)
            elif t == "offset":
                # Ramp up to `delta` over `ramp_hours`, hold, then (if `end`) stop.
                frac = min(1.0, _hours(f, e) / f.get("ramp_hours", 1)) if f.get("ramp_hours") else 1.0
                e["value"] = round(e["value"] + f["delta"] * frac, 4)
            else:
                raise ValueError(f"unknown fault type {t}")
            e["source"] = "simulated"
        if not drop:
            out.append(e)
    return out


def pump_failed(faults: list[dict], zone: str, ts: str) -> bool:
    """Equipment fault the verify node consults: the actuator accepts the command but nothing moves."""
    return any(f["type"] == "pump_failure" and f["zone"] == zone and f["start"] <= ts < f.get("end", "9999")
               for f in faults)
