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
LEVEL_LOW_CM = 10.0
SOLUTION_TEMP_HIGH_C = 26.0
RH_HIGH_PCT = 90.0  # sustained high humidity raises fungal disease risk
# Limits the learned forecasters are checked against (app/sensor_models.signals): (low, high), None = no limit.
FORECAST_LIMITS = {"air_temp": (None, AIR_TEMP_VENT_C), "vpd": (None, VPD_HIGH_KPA), "ph": PH_TARGET, "ec": EC_TARGET,
                   "solution_temp": (None, SOLUTION_TEMP_HIGH_C), "rh": (None, RH_HIGH_PCT), "level": (LEVEL_LOW_CM, None)}


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
        # Act early: the learned forecaster expects the limit to be crossed (central forecast, not just the band).
        s = (state.get("model_signals") or {}).get(zone, {}).get("air_temp")
        early = [b for b in (s or {}).get("breaches", []) if b["likely"] and b["side"] == "high"]
        if t and not hot and early and "air_temp" not in bad.get(zone, []):
            b = early[0]
            out.append(_action(run, "ventilate", zone, {"pct": 40},
                               f"air {t['value']} C now; forecast {b['forecast']} C within {b['horizon']} "
                               f"(band {b['band'][0]}-{b['band'][1]}) > {AIR_TEMP_VENT_C}", [t["id"], s["id"]],
                               "air_temp stays below limit", 0.6))
    return out


def sensor_alerts_from_models(state: dict) -> list[dict]:
    """Human alerts from the learned models: a probe that drifts from its forecast, a tank about to run low,
    humidity heading into the disease-risk band. Alerts only; nothing is dosed or moved on a forecast alone."""
    run, out = _run(state), []
    for zone, ms in (state.get("model_signals") or {}).items():
        for metric, s in ms.items():
            a = s.get("anomaly")
            if a and a["alarm"]:
                out.append(_action(run, "alert", zone, {"message": f"Check the {metric} probe: readings drift from the learned forecast"},
                                   f"model anomaly score {a['score']} > {a['threshold']}", [s["id"]], "a person checks the probe", 0.6))
            for b in s["breaches"]:
                if b["likely"] and metric in ("level", "rh", "solution_temp"):
                    msg = {"level": "Tank level forecast to fall below the refill mark: top up soon",
                           "rh": "Humidity forecast above 90%: ventilate or space plants to cut disease risk",
                           "solution_temp": "Nutrient solution forecast above 26 C: shade or cool the tank"}[metric]
                    out.append(_action(run, "alert", f"{zone}", {"message": msg},
                                       f"{metric} forecast {b['forecast']} within {b['horizon']} vs limit {b['limit']}",
                                       [s["id"]], "a person acts before the limit", 0.6))
    return out


def irrigation(state: dict) -> list[dict]:
    """Field beds: twin-backed comparison of hold / irrigate now / irrigate tonight (app/irrigation.py).
    Other zones: soil-moisture rule."""
    snap, bad, run = state["snapshot"], state.get("bad_metrics", {}), _run(state)
    out = []
    f = state["scenario"].get("field")
    if f and f["zone"] in snap and "root_zone_water" not in bad.get(f["zone"], []):
        from . import irrigation as irr
        from .graphs.farm_shift import field_history
        try:
            dec = irr.agent_decide(f["planting"], state["sim_time"][:10], field_history(state))
        except Exception as e:
            return [_action(run, "alert", f["zone"], {"message": f"Irrigation planner unavailable: {type(e).__name__}"},
                            "Twin or weather unavailable; no irrigation proposed", [], "none", 1.0)]
        if dec["option"] == "hold":
            return [_action(run, "no_op", f["zone"], {"decision": "hold", "options": dec["options"]}, dec["rationale"],
                            dec["evidence"], "none", 0.9)]
        when = "now" if dec["option"] == "irrigate_now" else "tonight"
        return [_action(run, "irrigate", f["zone"],
                        {"mm": dec["depth_mm"], "minutes": dec["depth_mm"], "when": when, "options": dec["options"]},
                        dec["rationale"], dec["evidence"], f"soil_moisture +{0.5 * dec['depth_mm']:g} in 60m", 0.85)]
    for zone in snap:
        sm = _good(snap, zone, "soil_moisture", bad)
        if sm and sm["value"] < 30:
            out.append(_action(run, "irrigate", zone, {"minutes": 15}, f"soil moisture {sm['value']}% < 30%",
                               [sm["id"]], "soil_moisture +7.5 in 60m"))
    return out


RESCAN_AFTER_DAYS = 5


def _new_images(state: dict) -> list[dict]:
    """Photos that arrived since the previous tick (scenario packs schedule them on the replay clock)."""
    from datetime import timedelta
    from .replay.clock import fmt_ts, parse_ts
    now = state["sim_time"]
    # Photos since the previous run of this session; a first run looks back one tick.
    since = state.get("prev_sim_time") or fmt_ts(parse_ts(now) - timedelta(minutes=state["scenario"].get("tick_minutes", 30)))
    return [i for i in state["scenario"].get("images", []) if since < i["at"] <= now]


def disease(state: dict) -> list[dict]:
    """classify_leaf tool -> abstain and ask for a re-photo, or propose treatment (always needs a human) with a re-scan."""
    from . import knowledge, vision_client
    run = _run(state)
    out = []
    for img in _new_images(state):
        try:
            r = vision_client.classify_file(img["path"], img.get("blur", 0))
        except Exception as e:
            out.append(_action(run, "alert", img["zone"], {"message": f"Leaf photo not analysed: vision service unavailable ({type(e).__name__})"},
                               "Vision unavailable; no diagnosis guessed", [f"img:{img['path']}"], "none", 1.0))
            continue
        ev = [f"img:{img['path']}@{img['at']}"]
        if r["abstain"]:
            out.append(_action(run, "alert", img["zone"], {"message": f"Please retake the leaf photo: {r['reason']}",
                                                           "vision": r}, "Classifier abstained instead of guessing", ev, "none", 1.0))
            continue
        top = r["top"]
        if top["healthy"]:
            continue
        docs = knowledge.search(f"{top['crop']} {top['condition']} management", k=2)
        out.append(_action(run, "treat_disease", img["zone"],
                           {"diagnosis": top["label"], "confidence": top["confidence"], "rescan_after_days": RESCAN_AFTER_DAYS,
                            "guidance": [d["id"] for d in docs],
                            "note": "No product or dose is chosen by the agent; a human decides using the cited sources."},
                           f"{top['crop']} {top['condition']} at {top['confidence']:.0%} (calibrated, threshold {r['threshold']:.0%})",
                           ev + [d["id"] for d in docs], f"rescan in {RESCAN_AFTER_DAYS}d", top["confidence"]))
    return out


def sensor_alerts(state: dict) -> list[dict]:
    run = _run(state)
    return [_action(run, "alert", f["zone"], {"message": f"{f['metric']} {f['check']}: {f['detail']}"},
                    "Sensor reading failed a quality check; not acted on", [], "none", 1.0)
            # Backup-probe faults are maintenance notes (shown in the trace), not farmer alerts every tick.
            for f in state.get("quality_flags", []) if f["severity"] == "bad" and not f["metric"].endswith("_b")][:5]
