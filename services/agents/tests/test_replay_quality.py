from app.quality import check_window
from app.replay.adapters import load_events
from app.replay.clock import ReplayClock
from app.replay.faults import apply_faults, pump_failed


def test_clock_speed_pause_seek_loop():
    wall = [0.0]
    c = ReplayClock("2020-03-01T00:00:00Z", "2020-03-01T02:00:00Z", 60, wall=lambda: wall[0])
    wall[0] = 60  # one wall minute = one sim hour at 60x
    assert c.now().isoformat().startswith("2020-03-01T01:00")
    c.pause(); wall[0] = 600
    assert c.now().isoformat().startswith("2020-03-01T01:00")
    c.resume(); c.seek("2020-03-01T00:30:00Z")
    assert c.now().isoformat().startswith("2020-03-01T00:30")
    wall[0] = 10_000
    assert c.finished
    looped = ReplayClock("2020-03-01T00:00:00Z", "2020-03-01T02:00:00Z", 60, loop=True, wall=lambda: wall[0])
    wall[0] += 150  # 2.5 sim hours -> wraps to 00:30
    assert looped.now().isoformat().startswith("2020-03-01T00:30")


def test_adapter_tags_source():
    ev = load_events("eden_iss", "2020-03-01T00:00:00Z", "2020-03-01T01:00:00Z")
    assert ev and all(e["source"] == "replay" for e in ev)
    assert {"air_temp", "ph", "ec", "vpd"} <= {e["metric"] for e in ev}


def _window(now, faults=()):
    ev = apply_faults(load_events("eden_iss", "2020-03-04T10:00:00Z", now), list(faults))
    return ev, check_window(ev, now)


def _flagged(q, metric, check=None):
    return any(f["metric"] == metric and (check is None or f["check"] == check) for f in q["quality_flags"])


def test_real_dataset_fault_is_caught():
    # EDEN ISS's redundant pH probe ph-tank1_2 reads ~8.5-12 while the primary reads ~6.1.
    _, q = _window("2020-03-05T10:00:00Z")
    assert _flagged(q, "ph_b", "range")
    assert "ph" not in q["bad_metrics"].get("tank1", [])  # primary stays usable


def test_clean_primaries_have_no_bad_flags_over_14_days():
    for day in range(2, 15):
        for hour in (3, 9, 12, 15, 21):
            now = f"2020-03-{day:02d}T{hour:02d}:00:00Z"
            q = check_window(load_events("eden_iss", f"2020-03-{day - 1:02d}T{hour:02d}:00:00Z", now), now)
            assert not q["bad_metrics"], (now, q["bad_metrics"])


def test_injected_faults_are_flagged():
    now = "2020-03-05T10:00:00Z"
    f = lambda t, m, **k: {"type": t, "zone": "tank1" if m in ("ph", "ec", "ec_b") else "feg", "metric": m,
                           "start": "2020-03-05T08:00:00Z", **k}
    # Stuck probe during a heat ramp: the partner probe keeps rising, the stuck one does not.
    heat = f("offset", "air_temp", delta=6, ramp_hours=2)
    ev, q = _window(now, [heat, f("stuck", "air_temp")]);     assert _flagged(q, "air_temp", "stuck")
    ev, q = _window(now, [f("drift", "ec", rate_per_hour=0.5)]); assert _flagged(q, "ec", "drift")
    ev, q = _window(now, [f("dropout", "vpd")]);              assert _flagged(q, "vpd", "dropout")
    spike = {"type": "spike", "zone": "feg", "metric": "air_temp", "start": "2020-03-05T09:55:00Z", "magnitude": 9}
    ev, q = _window(now, [spike]);                            assert _flagged(q, "air_temp", "rate_of_change")
    assert all(e["source"] == "simulated" for e in ev if e["metric"] == "air_temp" and e["ts"] >= "2020-03-05T09:55")
    assert pump_failed([{"type": "pump_failure", "zone": "tank1", "start": "2020-03-05T08:00:00Z"}], "tank1", now)


def test_long_dropout_does_not_crash_and_is_flagged():
    ev = [{"ts": f"2020-03-01T0{h}:00:00Z", "zone": "tank1", "metric": "ph", "value": 6.0, "unit": "pH", "source": "replay"}
          for h in range(3)]  # last reading 02:00, checked at 09:00 -> nothing in the 4 h drift window
    out = check_window(ev, "2020-03-01T09:00:00Z")
    assert "ph" in out["bad_metrics"]["tank1"]
