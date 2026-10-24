import math

import pytest

from app import sensor_models as S, specialists

pytestmark = pytest.mark.skipif(not S.available(), reason="sensor models not installed (scripts/fetch_sensor_models.ps1)")


def _ramp(start, step, n=300):
    return [start + step * i for i in range(n)]


def test_forecast_band_and_breach():
    vals = [21 + 2 * math.sin(i / 288 * 2 * math.pi) for i in range(300)]
    fc = S.forecast("air_temp", vals, "2020-10-05T12:00:00Z")
    for h in ("30min", "2h"):
        f = fc["horizons"][h]
        assert f["low"] <= f["value"] <= f["high"]
    assert S.breach(fc, None, -100) and all(b["side"] == "high" for b in S.breach(fc, None, -100))
    assert S.breach(fc, None, 1000) == []


def test_anomaly_flags_a_drifting_probe_but_not_a_steady_one():
    # Controlled greenhouse air (EDEN-like: flat with sensor noise); the probe then drifts +0.48 C/h.
    import random
    r = random.Random(1)
    steady = [21 + 0.05 * r.gauss(0, 1) for _ in range(300)]
    drift = steady[:220] + [v + 0.04 * (i + 1) for i, v in enumerate(steady[220:])]
    assert not S.anomaly("air_temp", steady, "2020-10-05T12:00:00Z")["alarm"]
    assert S.anomaly("air_temp", drift, "2020-10-05T12:00:00Z")["alarm"]


def test_signals_feed_alerts_without_dosing():
    ev = [{"ts": f"2020-10-05T{i // 12:02d}:{i % 12 * 5:02d}:00Z", "zone": "tank1", "metric": "level",
           "value": 30 - 0.1 * i, "unit": "cm", "source": "replay"} for i in range(240)]
    sig = S.signals(ev, ev[-1]["ts"], specialists.FORECAST_LIMITS)
    assert "level" in sig["tank1"]
    props = specialists.sensor_alerts_from_models({"run_id": "r", "model_signals": sig})
    assert all(p["kind"] == "alert" for p in props)


def test_soil_forecast_dries_without_rain():
    if not S.soil_bundle():
        pytest.skip("soil model not installed")
    f = S.soil_forecast(wr=120, wr_1d_ago=124, wr_3d_ago=132, dap=60, soil="SandyLoam",
                        et0_next=[5, 5, 5], rain_next=[0, 0, 0])
    assert f["days"][3] < f["days"][1] < 120
