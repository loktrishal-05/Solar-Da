from datetime import timedelta

from app import runner
from app.replay.clock import parse_ts
from app.triggers import TriggerEngine


def _ev(ts, metric, value, zone="feg"):
    return {"ts": ts, "zone": zone, "metric": metric, "value": value, "unit": "", "source": "replay"}


def test_threshold_fires_once_on_crossing_then_cools_down():
    eng = TriggerEngine({"tick_minutes": 1440})
    t0 = parse_ts("2020-03-03T10:00:00Z")
    first = eng.check(t0, [_ev("2020-03-03T10:00:00Z", "air_temp", 24.0)], None)
    assert first["heartbeat"] and [x["kind"] for x in first["triggers"]] == ["schedule"]
    t1 = t0 + timedelta(minutes=5)
    hot = eng.check(t1, [_ev("2020-03-03T10:05:00Z", "air_temp", 27.5)], t0)
    assert hot["run"] and any(x["kind"] == "threshold" and x["metric"] == "air_temp" for x in hot["triggers"])
    t2 = t1 + timedelta(minutes=5)
    again = eng.check(t2, [_ev("2020-03-03T10:10:00Z", "air_temp", 27.6)], t1)
    assert not again["run"]  # still out, inside the 60-min re-fire window
    t3 = t1 + timedelta(minutes=61)
    later = eng.check(t3, [_ev("2020-03-03T11:06:00Z", "air_temp", 27.6)], t2)
    assert any(x["kind"] == "threshold" for x in later["triggers"])  # re-fires while still out, so verify keeps going


def test_rate_limit_keeps_urgent_triggers():
    eng = TriggerEngine({"tick_minutes": 1440})
    t = parse_ts("2020-03-03T10:00:00Z")
    eng.check(t, [], None)  # heartbeat
    eng.runs = [t] * 6
    eng.manual.append({"zone": "*", "metric": "*", "detail": "farmer asked"})
    d = eng.check(t + timedelta(minutes=5), [_ev("2020-03-03T10:05:00Z", "air_temp", 30.0)], t)
    assert [x["kind"] for x in d["triggers"]] == ["manual"] and d["suppressed"]


def test_heatwave_reacts_faster_with_fewer_or_equal_runs_than_the_fixed_tick():
    trg = runner.run_scenario_triggered("heatwave")
    acts = [(v["sim_time"], d["kind"]) for v in trg["runs"] for d in v.get("dispatched", []) if d["status_code"] in (200, 201)]
    assert any(k == "ventilate" for _, k in acts)
    first_trigger = next(v for v in trg["runs"] if any(t["kind"] == "threshold" for t in v["triggers"]))
    assert "Triggered by threshold" in next(t["summary"] for t in first_trigger["trace"] if t["node"] == "ingest")
