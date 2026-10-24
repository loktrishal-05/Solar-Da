"""Learned sensor models trained on the full EDEN ISS 2020 year (5-minute data, CC BY 4.0).

Forecasters: for each stream, gradient-boosted trees predict the change over the next 30 min and 2 h, with a 10-90%
band (quantile models). Each forecast is a proposal input only; the TypeScript engine still decides every action.

Training and evaluation: bench/train_sensor_models.py. Weights are not committed: they are attached to the GitHub
release `sensor-models-v1` and installed by scripts/fetch_sensor_models.ps1 into services/agents/model/.
"""
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd

from .quality import RANGES, SENTINEL

ROOT = Path(__file__).resolve().parents[3]
EDEN = ROOT / "data" / "replay" / "full" / "eden" / "edeniss2020"
MODEL_FILE = Path(__file__).resolve().parents[1] / "model" / "sensor_models.joblib"
STEP_MIN = 5
HORIZONS = {"30min": 6, "2h": 24}  # steps of 5 min
LAGS = (1, 2, 3, 6, 12, 24, 48, 288)  # 5 min .. 24 h

# metric -> EDEN files (tank streams pool tank1 + tank2 for more training data). Scale converts units.
STREAMS = {
    "ph": (["nds/ph-tank1_1.csv", "nds/ph-tank2_1.csv"], 1),
    "ec": (["nds/ec-tank1_1.csv", "nds/ec-tank2_1.csv"], 1),
    "solution_temp": (["nds/temp-tank1_1.csv", "nds/temp-tank2_1.csv"], 1),
    "level": (["nds/level-tank1.csv", "nds/level-tank2.csv"], 1),
    "air_temp": (["ams-feg/temp-1.csv"], 1),
    "rh": (["ams-feg/rh-1.csv"], 1),
    "co2": (["ams-feg/co2-1.csv"], 1),
    "vpd": (["ams-ses/vpd-1.csv"], 0.1),  # mbar -> kPa
}


def load_stream(file: str, metric: str, scale: float = 1) -> pd.Series:
    """Regular 5-min series; sentinel and physically implausible values become NaN (they are faults, not data)."""
    d = pd.read_csv(EDEN / file, parse_dates=["time"])
    v = d.iloc[:, 1].astype(float)
    v = v.where(v != SENTINEL) * scale
    lo, hi = RANGES.get(metric, (-np.inf, np.inf))
    s = pd.Series(v.where((v >= lo) & (v <= hi)).values, index=d.time).sort_index()
    s = s[~s.index.duplicated()]
    return s.asfreq(f"{STEP_MIN}min")


def features(s: pd.Series) -> pd.DataFrame:
    """Features at each timestamp from the series up to and including that timestamp (no future values)."""
    f = pd.DataFrame({"value": s})
    for k in LAGS:
        f[f"d{k}"] = s - s.shift(k)
    f["mean_1h"] = s.rolling(12, min_periods=6).mean() - s
    f["std_1h"] = s.rolling(12, min_periods=6).std()
    f["mean_6h"] = s.rolling(72, min_periods=36).mean() - s
    tod = (s.index.hour * 60 + s.index.minute) / 1440
    f["tod_sin"], f["tod_cos"] = np.sin(2 * np.pi * tod), np.cos(2 * np.pi * tod)
    return f


@lru_cache(maxsize=1)
def bundle() -> dict | None:
    if not MODEL_FILE.exists():
        return None
    import joblib

    return joblib.load(MODEL_FILE)


def available() -> bool:
    return bundle() is not None


def forecast(metric: str, recent: list[float], last_ts: str) -> dict | None:
    """Forecast from the most recent readings (oldest first, 5-min spacing, >= 289 points for the 24 h lag;
    shorter histories still work, the missing lags are NaN). Returns per-horizon value and 10-90% band."""
    b = bundle()
    if not b or metric not in b["models"] or not recent:
        return None
    idx = pd.date_range(end=pd.Timestamp(last_ts).tz_localize(None), periods=len(recent), freq=f"{STEP_MIN}min")
    x = features(pd.Series(recent, index=idx, dtype=float)).iloc[[-1]][b["feature_names"]]
    now = float(recent[-1])
    out = {}
    for h, m in b["models"][metric].items():
        p = {q: float(model.predict(x)[0]) for q, model in m.items() if q != "use_model"}
        if not m.get("use_model", True):
            p["mean"] = 0.0  # point forecast lost to "no change" on validation: keep only the band
        lo, mid, hi = sorted((p["q10"], p["mean"], p["q90"]))
        out[h] = {"value": round(now + mid, 3), "low": round(now + lo, 3), "high": round(now + hi, 3)}
    return {"metric": metric, "from": last_ts, "now": now, "horizons": out, "source": "model:sensor-models-v1"}


CUSUM_K = 0.5  # allowance in band units; the alarm level per metric is tuned on September (bench/eval_anomaly.py)


def residual_z(metric: str, s: pd.Series, b: dict | None = None) -> pd.Series:
    """How surprising each reading is: (actual - what the model predicted 30 min earlier) / half the 10-90% band."""
    b = b or bundle()
    m = b["models"][metric]["30min"]
    f = features(s)[b["feature_names"]]
    ok = f["value"].notna()
    pred, lo, hi = (pd.Series(np.nan, index=s.index) for _ in range(3))
    if ok.any():
        X = f[ok]
        pred[ok], lo[ok], hi[ok] = (m[q].predict(X) for q in ("mean", "q10", "q90"))
    k = HORIZONS["30min"]
    expected = (s + pred).shift(k)  # forecast made k steps ago for now
    scale = ((hi - lo).abs() / 2.56).shift(k)
    floor = b.get("scale_floor", {}).get(metric, 1e-6)
    return (s - expected) / scale.clip(lower=floor)


def cusum(z: pd.Series, h: float, k: float = CUSUM_K) -> tuple[pd.Series, pd.Series]:
    """Two-sided CUSUM on z; returns (statistic, alarm) series. Resets after an alarm."""
    stat, alarm = np.zeros(len(z)), np.zeros(len(z), dtype=bool)
    sp = sn = 0.0
    for i, v in enumerate(np.nan_to_num(z.values, nan=0.0)):
        v = float(np.clip(v, -10, 10))  # one wild sample (a spike) is the rate-of-change rule's job
        sp, sn = max(0.0, sp + v - k), max(0.0, sn - v - k)
        stat[i] = max(sp, sn)
        if stat[i] > h:
            alarm[i] = True
            sp = sn = 0.0
    return pd.Series(stat, index=z.index), pd.Series(alarm, index=z.index)


def anomaly(metric: str, recent: list[float], last_ts: str) -> dict | None:
    """Streaming check over the recent window (>= 1 day of 5-min readings works best)."""
    b = bundle()
    if not b or metric not in b.get("anomaly", {}) or len(recent) < 2 * HORIZONS["30min"]:
        return None
    idx = pd.date_range(end=pd.Timestamp(last_ts).tz_localize(None), periods=len(recent), freq=f"{STEP_MIN}min")
    z = residual_z(metric, pd.Series(recent, index=idx, dtype=float), b)
    h = b["anomaly"][metric]["h"]
    stat, alarm = cusum(z.iloc[-144:], h)  # last 12 h
    return {"metric": metric, "score": round(float(stat.iloc[-1]), 2), "threshold": h,
            "alarm": bool(alarm.iloc[-36:].any()), "z_last": round(float(np.nan_to_num(z.iloc[-1])), 2),
            "source": "model:sensor-models-v1"}


def signals(events: list[dict], now: str, limits: dict[str, tuple]) -> dict:
    """Forecast + anomaly score for every primary stream in the replay window (5-min data only).
    Returns {zone: {metric: {"forecast", "anomaly", "breaches", "id"}}}. Empty when the models are not installed."""
    if not available():
        return {}
    by: dict[tuple, list[dict]] = {}
    for e in events:
        if e["ts"] <= now and e["metric"] in STREAMS and e.get("source") != "twin":
            by.setdefault((e["zone"], e["metric"]), []).append(e)
    out: dict = {}
    for (zone, metric), s in by.items():
        if len(s) < 13:
            continue
        vals = [np.nan if (e["value"] == SENTINEL or not RANGES.get(metric, (-np.inf, np.inf))[0] <= e["value"]
                           <= RANGES.get(metric, (-np.inf, np.inf))[1]) else e["value"] for e in s]
        last = s[-1]["ts"]
        fc = forecast(metric, vals, last) if not np.isnan(vals[-1]) else None
        an = anomaly(metric, vals, last)
        lo, hi = limits.get(metric, (None, None))
        out.setdefault(zone, {})[metric] = {"forecast": fc, "anomaly": an, "breaches": breach(fc, lo, hi) if fc else [],
                                            "id": f"model:{zone}:{metric}:{last}"}
    return out


SOIL_FILE = MODEL_FILE.parent / "soil_model.joblib"
SOIL_HORIZONS = (1, 2, 3)  # days


def soil_features(wr: float, wr_1d_ago: float, wr_3d_ago: float, dap: int, soil: str,
                  et0_next: list[float], rain_next: list[float]) -> dict:
    """One row of soil-forecaster inputs. et0_next / rain_next: the next 3 days (forecast)."""
    from .irrigation import kc

    f = {"wr": wr, "d1": wr - wr_1d_ago, "d3": wr - wr_3d_ago, "dap": dap, "kc": kc(dap),
         "soil_sandy": soil == "SandyLoam", "soil_clay": soil == "ClayLoam"}
    for i in range(3):
        f[f"et0_{i + 1}"] = et0_next[i]
        f[f"rain_{i + 1}"] = rain_next[i]
    return f


@lru_cache(maxsize=1)
def soil_bundle() -> dict | None:
    if not SOIL_FILE.exists():
        return None
    import joblib

    return joblib.load(SOIL_FILE)


def soil_forecast(**kw) -> dict | None:
    """Root-zone water (mm) 1-3 days ahead if nothing is irrigated. Learned emulator of the AquaCrop twin:
    trained on simulated seasons, so it inherits the twin's limits (no salinity/fertility stress)."""
    b = soil_bundle()
    if not b:
        return None
    row = pd.DataFrame([soil_features(**kw)])[b["feature_names"]]
    return {"wr_now": kw["wr"], "days": {d: round(kw["wr"] + float(b["models"][d].predict(row)[0]), 1) for d in SOIL_HORIZONS},
            "assumes": "no irrigation in the window", "source": "model:soil-v1 (twin emulator, simulated training data)"}


def breach(fc: dict, lo: float | None, hi: float | None) -> list[dict]:
    """Horizons where the forecast band crosses a limit. `likely` when the central forecast itself crosses."""
    out = []
    for h, f in (fc or {}).get("horizons", {}).items():
        for side, lim in (("low", lo), ("high", hi)):
            if lim is None:
                continue
            crosses_band = f["low"] < lim if side == "low" else f["high"] > lim
            crosses_mid = f["value"] < lim if side == "low" else f["value"] > lim
            if crosses_band:
                out.append({"horizon": h, "side": side, "limit": lim, "forecast": f["value"],
                            "band": [f["low"], f["high"]], "likely": crosses_mid})
    return out
