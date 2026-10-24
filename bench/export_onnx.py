"""Export the trained sensor and soil models (joblib, scikit-learn) to ONNX so the runtime needs only onnxruntime.
    services/agents/.venv/Scripts/python bench/export_onnx.py        (needs: pip install skl2onnx; one-time, not a runtime dependency)
Writes services/agents/model/onnx/{meta.json,*.onnx} and checks every model against the original on random rows incl. NaN."""
import json
from pathlib import Path

import joblib
import numpy as np
from skl2onnx import to_onnx

import skl2onnx.common.tree_ensemble as _te

_add = _te.add_node  # skl2onnx 1.20 passes numpy bools for the missing-value flag; ONNX wants ints


def _add_int(attr_pairs, *a, **k):
    if "nodes_missing_value_tracks_true" in k:
        k["nodes_missing_value_tracks_true"] = int(k["nodes_missing_value_tracks_true"])
    return _add(attr_pairs, *a, **k)


_te.add_node = _add_int
M = Path(__file__).resolve().parents[1] / "services" / "agents" / "model"
OUT = M / "onnx"
OUT.mkdir(exist_ok=True)


def export(model, n_features: int, name: str, rng) -> str:
    to = to_onnx(model, np.zeros((1, n_features), dtype=np.float32), target_opset=15)
    (OUT / f"{name}.onnx").write_bytes(to.SerializeToString())
    import onnxruntime as ort
    x = rng.normal(size=(64, n_features)).astype(np.float32) * 3
    x[rng.random(x.shape) < 0.1] = np.nan  # lags are NaN on short histories
    got = ort.InferenceSession(str(OUT / f"{name}.onnx")).run(None, {"X": x})[0].ravel()
    err = float(np.max(np.abs(got - model.predict(x))))
    assert err < 1e-3, f"{name}: ONNX differs from scikit-learn by {err}"
    return f"{name}.onnx"


rng = np.random.default_rng(0)
b = joblib.load(M / "sensor_models.joblib")
n = len(b["feature_names"])
meta = {k: b[k] for k in ("feature_names", "version", "trained_on", "scale_floor", "anomaly")}
meta["models"] = {mt: {h: {q: export(m, n, f"s__{mt}__{h}__{q}", rng) for q, m in qs.items() if q != "use_model"}
                       | ({"use_model": qs["use_model"]} if "use_model" in qs else {}) for h, qs in hs.items()}
                  for mt, hs in b["models"].items()}
s = joblib.load(M / "soil_model.joblib")
meta["soil"] = {"feature_names": s["feature_names"], "version": s["version"],
                "models": {str(d): export(m, len(s["feature_names"]), f"soil__{d}", rng) for d, m in s["models"].items()}}
(OUT / "meta.json").write_text(json.dumps(meta), encoding="utf-8")
print("exported", len(list(OUT.glob("*.onnx"))), "models,", sum(p.stat().st_size for p in OUT.glob("*.onnx")) // 1024, "KB")
