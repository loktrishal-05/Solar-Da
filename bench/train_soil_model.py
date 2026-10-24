"""Soil-water forecaster (twin emulator) vs persistence and the FAO-56 bucket model.

Train on simulated 2021-2022 seasons, test on 2023 (bench/gen_soil_seasons.py). Target: root-zone water 1-3 days
ahead given the rain/ET0 forecast (archive actuals = perfect forecast) and the irrigation actually applied is
excluded: rows whose window contains irrigation are dropped, so the model answers "what if we hold".
Run: services/agents/.venv/Scripts/python -I bench/train_soil_model.py
"""
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import sensor_models as S  # noqa: E402
from app.irrigation import kc  # noqa: E402


def rows(d: pd.DataFrame) -> pd.DataFrame:
    out = []
    for _, g in d.groupby("season"):
        g = g.reset_index(drop=True)
        for t in range(3, len(g) - 3):
            if g.irrigation[t + 1: t + 4].sum() > 0:
                continue
            f = S.soil_features(g.wr[t], g.wr[t - 1], g.wr[t - 3], int(g.dap[t]), g.soil[t],
                                list(g.et0[t + 1: t + 4]), list(g.rain[t + 1: t + 4]))
            f.update({f"y{h}": g.wr[t + h] - g.wr[t] for h in S.SOIL_HORIZONS})
            # FAO-56 bucket baseline: water falls by Kc*ET0 and rises by rain (no drainage, no cap).
            b = 0.0
            for h in S.SOIL_HORIZONS:
                b += g.rain[t + h] - kc(int(g.dap[t + h])) * g.et0[t + h]
                f[f"bucket{h}"] = b
            f["year"] = g.year[t]
            out.append(f)
    return pd.DataFrame(out)


def main():
    d = rows(pd.read_csv(ROOT / "data" / "raw" / "soil_seasons.csv", parse_dates=["date"]))
    feat = [c for c in d.columns if not c.startswith(("y", "bucket")) and c != "year"]
    tr, te = d[d.year < 2023], d[d.year == 2023]
    models, res = {}, {}
    for h in S.SOIL_HORIZONS:
        m = HistGradientBoostingRegressor(max_iter=400, learning_rate=0.05, random_state=1337).fit(tr[feat], tr[f"y{h}"])
        models[h] = m
        y = te[f"y{h}"].values
        res[f"{h}d"] = {"mae_model_mm": round(float(np.mean(np.abs(y - m.predict(te[feat])))), 2),
                        "mae_persistence_mm": round(float(np.mean(np.abs(y))), 2),
                        "mae_bucket_mm": round(float(np.mean(np.abs(y - te[f"bucket{h}"].values))), 2), "n_test": int(len(y))}
        print(h, res[f"{h}d"])
    S.SOIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"models": models, "feature_names": feat, "version": "soil-v1"}, S.SOIL_FILE, compress=3)
    out = {"data": "AquaCrop twin, 72 simulated tomato seasons (3 soils, random irrigation), Chennai 2021-2023 weather",
           "split": "train 2021-2022, test 2023", "target": "root-zone water change with no irrigation, 1-3 days",
           "results": res, "caveat": "Simulated: the model learns the twin, not a field. It is useful because it is "
                                     "~1000x faster than running AquaCrop for every trigger check.",
           "no_gain": [f"{h}: model {r['mae_model_mm']} >= bucket {r['mae_bucket_mm']}" for h, r in res.items()
                       if r["mae_model_mm"] >= r["mae_bucket_mm"]]}
    (ROOT / "bench" / "results" / "soil_forecast.json").write_text(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
