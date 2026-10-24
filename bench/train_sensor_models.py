"""Train and evaluate the sensor forecasters on EDEN ISS 2020 (train Jan-Aug, validation Sep, test Oct-Dec).

Baselines: persistence (no change) and seasonal naive (same time yesterday). Skill = 1 - MAE_model / MAE_persistence.
Run (needs data/replay/full/eden from `python -m app.replay.build_slices`):
  services/agents/.venv/Scripts/python -I bench/train_sensor_models.py
Writes services/agents/model/sensor_models.joblib (not committed; release sensor-models-v1) and
bench/results/sensor_forecast.json.
"""
import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import sensor_models as S  # noqa: E402

TRAIN_END, VAL_END = "2020-09-01", "2020-10-01"
SEED = 1337


def frames(metric: str):
    files, scale = S.STREAMS[metric]
    parts = []
    for f in files:
        s = S.load_stream(f, metric, scale)
        x = S.features(s)
        for h, k in S.HORIZONS.items():
            x[f"y_{h}"] = s.shift(-k) - s
            # Seasonal naive: the change equals the change over the same window 24 h earlier.
            x[f"seasonal_{h}"] = s.shift(288 - k) - s.shift(288)
        x["file"] = f
        parts.append(x)
    return pd.concat(parts)


def fit(X, y, loss, q=None):
    kw = {"loss": loss, "max_iter": 300, "learning_rate": 0.06, "max_leaf_nodes": 31, "early_stopping": True,
          "validation_fraction": 0.1, "random_state": SEED}
    if q is not None:
        kw["quantile"] = q
    return HistGradientBoostingRegressor(**kw).fit(X, y)


def main():
    feat = None
    models, report = {}, {}
    for metric in S.STREAMS:
        t0 = time.time()
        d = frames(metric)
        feat = [c for c in d.columns if not c.startswith(("y_", "seasonal_", "file"))]
        models[metric], report[metric] = {}, {}
        for h, k in S.HORIZONS.items():
            ok = d[f"y_{h}"].notna() & d["value"].notna()
            tr = d[ok & (d.index < TRAIN_END)].iloc[::2]  # every 2nd row: neighbours are near-duplicates
            te = d[ok & (d.index >= VAL_END)]
            m = {"mean": fit(tr[feat], tr[f"y_{h}"], "absolute_error"),
                 "q10": fit(tr[feat], tr[f"y_{h}"], "quantile", 0.1),
                 "q90": fit(tr[feat], tr[f"y_{h}"], "quantile", 0.9)}
            models[metric][h] = m
            # Decide on September (validation) whether the point forecast beats "no change"; if not, serve persistence.
            va = d[ok & (d.index >= TRAIN_END) & (d.index < VAL_END)]
            use_model = float(np.mean(np.abs(va[f"y_{h}"] - m["mean"].predict(va[feat])))) < float(np.mean(np.abs(va[f"y_{h}"])))
            m["use_model"] = use_model
            y = te[f"y_{h}"].values
            pred = m["mean"].predict(te[feat]) if use_model else np.zeros(len(te))
            lo, hi = m["q10"].predict(te[feat]), m["q90"].predict(te[feat])
            sn = te[f"seasonal_{h}"].values
            sn_ok = ~np.isnan(sn)
            mae_p = float(np.mean(np.abs(y)))
            res = {"n_test": int(len(y)), "mae_model": round(float(np.mean(np.abs(y - pred))), 4),
                   "mae_persistence": round(mae_p, 4),
                   "mae_seasonal_naive": round(float(np.mean(np.abs(y[sn_ok] - sn[sn_ok]))), 4),
                   "point_forecast": "model" if use_model else "persistence (model lost on September validation)",
                   "band_coverage_10_90": round(float(np.mean((y >= np.minimum(lo, hi)) & (y <= np.maximum(lo, hi)))), 3)}
            res["skill_vs_persistence"] = round(1 - res["mae_model"] / mae_p, 3) if mae_p else None
            report[metric][h] = res
        print(metric, json.dumps(report[metric]), f"{time.time() - t0:.0f}s", flush=True)

    S.MODEL_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"models": models, "feature_names": feat, "version": "sensor-models-v1",
                 "trained_on": "EDEN ISS 2020 Jan-Aug (tank1+tank2 pooled for tank streams)"}, S.MODEL_FILE, compress=3)
    out = {"data": "EDEN ISS 2020 (Zenodo 11485183, CC BY 4.0), 5-min", "split": "train Jan-Aug, test Oct-Dec",
           "model": "HistGradientBoosting (median + 10%/90% quantile; persistence point where the model lost on validation) on lags 5 min-24 h, rolling stats, time of day",
           "results": report,
           "no_gain": [f"{m} {h}: skill {r['skill_vs_persistence']} (MAE {r['mae_model']} vs persistence {r['mae_persistence']})"
                       for m, hs in report.items() for h, r in hs.items() if (r["skill_vs_persistence"] or 0) <= 0.05]}
    (ROOT / "bench" / "results" / "sensor_forecast.json").write_text(json.dumps(out, indent=1))
    print("no gain:", out["no_gain"])


if __name__ == "__main__":
    main()
