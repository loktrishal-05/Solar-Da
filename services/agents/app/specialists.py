"""Rules-only specialists. They run with no LLM and no network, so the demo survives a failed connection.

Each takes the fused snapshot (+ weather/situation) and returns ProposedAction dicts. They never act;
the safety gate decides. Thresholds are planner targets, not safety limits (those live in the engine).
"""
import hashlib

PH_TARGET = (5.8, 6.4)
EC_TARGET = (1.4, 2.4)
AIR_TEMP_VENT_C = 26.0
AIR_TEMP_SHADE_C = 28.5
VPD_HIGH_KPA = 1.5
PH_GAIN_PER_ML = 0.03  # matches the simulated plant in the API
PH_DOSE_CAP_ML = 20


def _id(run_id: str, kind: str, zone: str) -> str:
    return "act-" + hashlib.sha1(f"{run_id}:{kind}:{zone}".encode()).hexdigest()[:10]


def _run(state: dict) -> str:
    return f"{state['run_id']}#{state.get('attempt', 0)}"  # a verify retry gets fresh action ids


def _action(run_id, kind, zone, params, rationale, evidence, expected, confidence=0.8):
    return {"id": _id(run_id, kind, zone), "kind": kind, "zone": zone, "params": params, "rationale": rationale,
            "evidence": evidence, "expected_effect": expected, "confidence": confidence}


def _good(snapshot, zone, metric, bad):
    r = snapshot.get(zone, {}).get(metric)
    return r if r and metric not in bad.get(zone, []) else None


def fertigation(state: dict) -> list[dict]:
    snap, bad, run = state["snapshot"], state.get("bad_metrics", {}), _run(state)
    out = []
    for zone in snap:
        ph = _good(snap, zone, "ph", bad)
        if ph and ph["value"] > PH_TARGET[1]:
            ml = min(PH_DOSE_CAP_ML, round((ph["value"] - sum(PH_TARGET) / 2) / PH_GAIN_PER_ML))
            out.append(_action(run, "dose_ph", zone, {"ml": ml, "direction": "down"},
                               f"pH {ph['value']} above target {PH_TARGET[1]}", [ph["id"]],
                               f"ph -{round(ml * PH_GAIN_PER_ML, 2)} in 30m"))
        elif ph and ph["value"] < PH_TARGET[0]:
            ml = min(PH_DOSE_CAP_ML, round((sum(PH_TARGET) / 2 - ph["value"]) / PH_GAIN_PER_ML))
            out.append(_action(run, "dose_ph", zone, {"ml": ml, "direction": "up"},
                               f"pH {ph['value']} below target {PH_TARGET[0]}", [ph["id"]],
                               f"ph +{round(ml * PH_GAIN_PER_ML, 2)} in 30m"))
        ec = _good(snap, zone, "ec", bad)
        if ec and ec["value"] < EC_TARGET[0]:
            out.append(_action(run, "dose_nutrient", zone, {"ml": 10}, f"EC {ec['value']} below {EC_TARGET[0]}",
                               [ec["id"]], "ec +0.1 in 30m"))
        elif ec and ec["value"] > EC_TARGET[1]:
            out.append(_action(run, "alert", zone, {"message": f"EC {ec['value']} high: top up with fresh water"},
                               "EC above target; dilution is a manual task", [ec["id"]], "none"))
    return out


def climate(state: dict) -> list[dict]:
    snap, bad, run = state["snapshot"], state.get("bad_metrics", {}), _run(state)
    out = []
    for zone in snap:
        t = _good(snap, zone, "air_temp", bad)
        vpd = _good(snap, zone, "vpd", bad)
        hot = t and t["value"] > AIR_TEMP_VENT_C
        dry = vpd and vpd["value"] > VPD_HIGH_KPA
        if hot or dry:
            ev = [r["id"] for r in (t, vpd) if r]
            why = "; ".join(x for x in (hot and f"air {t['value']} C > {AIR_TEMP_VENT_C}",
                                         dry and f"VPD {vpd['value']} kPa > {VPD_HIGH_KPA}") if x)
            out.append(_action(run, "ventilate", zone, {"pct": 70}, why, ev, "air_temp -2.8 in 10m"))
        if t and t["value"] > AIR_TEMP_SHADE_C:
            out.append(_action(run, "shade", zone, {"pct": 50}, f"air {t['value']} C > {AIR_TEMP_SHADE_C}",
                               [t["id"]], "air_temp -1.0 in 10m", 0.7))
    return out


def irrigation(state: dict) -> list[dict]:
    """Phase 1: soil-moisture rule. Phase 2 replaces this with the twin-backed three-option comparison."""
    snap, bad, run = state["snapshot"], state.get("bad_metrics", {}), _run(state)
    out = []
    for zone in snap:
        sm = _good(snap, zone, "soil_moisture", bad)
        if sm and sm["value"] < 30:
            out.append(_action(run, "irrigate", zone, {"minutes": 15}, f"soil moisture {sm['value']}% < 30%",
                               [sm["id"]], "soil_moisture +7.5 in 60m"))
    return out


def disease(state: dict) -> list[dict]:
    """Phase 1 placeholder: the vision tool arrives in Phase 3. Without it the specialist proposes nothing."""
    return []


def sensor_alerts(state: dict) -> list[dict]:
    run = _run(state)
    return [_action(run, "alert", f["zone"], {"message": f"{f['metric']} {f['check']}: {f['detail']}"},
                    "Sensor reading failed a quality check; not acted on", [], "none", 1.0)
            # Backup-probe faults are maintenance notes (shown in the trace), not farmer alerts every tick.
            for f in state.get("quality_flags", []) if f["severity"] == "bad" and not f["metric"].endswith("_b")][:5]
