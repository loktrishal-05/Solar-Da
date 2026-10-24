import numpy as np
import pytest

from app import sensor_models as sm

pytestmark = pytest.mark.skipif(not (sm.ONNX_DIR / "meta.json").exists() or not sm.MODEL_FILE.exists(),
                                reason="needs both the ONNX export and the original joblib models")


def _run(monkeypatch, use_onnx: bool):
    monkeypatch.setattr(sm, "ONNX_DIR", sm.ONNX_DIR if use_onnx else sm.ONNX_DIR / "missing")
    for f in (sm.bundle, sm._onnx_meta, sm.soil_bundle):
        f.cache_clear()
    rng = np.random.default_rng(1)
    out = {}
    for metric in ("air_temp", "rh", "ec"):
        recent = list(20 + np.cumsum(rng.normal(0, 0.05, 400)))
        out[metric] = (sm.forecast(metric, recent, "2020-10-01T12:00:00"), sm.anomaly(metric, recent, "2020-10-01T12:00:00"))
    row = dict(wr=60.0, wr_1d_ago=62.0, wr_3d_ago=68.0, dap=40, soil="SandyLoam", et0_next=[4, 5, 4], rain_next=[0, 2, 0])
    out["soil"] = sm.soil_forecast(**row)
    return out


def test_onnx_runtime_matches_scikit_learn(monkeypatch):
    a, b = _run(monkeypatch, True), _run(monkeypatch, False)
    for f in (sm.bundle, sm._onnx_meta, sm.soil_bundle):
        f.cache_clear()
    for metric in ("air_temp", "rh", "ec"):
        for h, v in a[metric][0]["horizons"].items():
            assert v["value"] == pytest.approx(b[metric][0]["horizons"][h]["value"], abs=0.01)
            assert v["low"] == pytest.approx(b[metric][0]["horizons"][h]["low"], abs=0.01)
        # CUSUM sums many float32 residuals, so the score may drift a little; the alarm decision must not change
        assert a[metric][1]["alarm"] == b[metric][1]["alarm"]
        assert a[metric][1]["score"] == pytest.approx(b[metric][1]["score"], rel=0.05, abs=0.2)
    assert a["soil"]["days"] == pytest.approx(b["soil"]["days"], abs=0.1)
