"""Learned anomaly detector (forecast-residual CUSUM) vs the rule-based quality checks, on injected sensor faults.

1. Tune: per metric, the CUSUM alarm level h is the lowest value giving <= 1 false alarm per 7 days on the clean
   September 2020 data (validation; the forecasters were trained on Jan-Aug).
2. Test (Oct-Dec 2020): inject drift and bias-step faults at random onsets (seeded) into the primary probe and
   check, at 15-minute steps for 6 h, whether each method flags that probe. False alarms are measured on the clean
   test data. Rules = services/agents/app/quality.check_window with the real backup probe where EDEN has one.
Run after bench/train_sensor_models.py:  services/agents/.venv/Scripts/python -I bench/eval_anomaly.py
"""
import json
import random
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import quality  # noqa: E402
from app import sensor_models as S  # noqa: E402

SEED, EPISODES, WINDOW_H = 1337, 25, 6
# metric -> (backup file for the rules or None, drift per hour, bias step)
FAULTS = {
    "ph": ("nds/ph-tank1_2.csv", 0.05, 0.3), "ec": ("nds/ec-tank1_2.csv", 0.05, 0.3),
    "solution_temp": (None, 0.3, 1.5), "air_temp": ("ams-feg/temp-2.csv", 0.3, 1.5),
    "rh": (None, 1.5, 8.0), "co2": (None, 40.0, 200.0), "level": (None, 0.5, 2.0),
}
BACKUP_NAME = {"ph": "ph_b", "ec": "ec_b", "air_temp": "air_temp_b"}


def primary(metric):
    files, scale = S.STREAMS[metric]
    return S.load_stream(files[0], metric, scale)


def alarms_per_day(alarm: pd.Series) -> float:
    return float(alarm.sum()) / max(1e-9, len(alarm) / 288)


def tune(metric, b) -> float:
    s = primary(metric)
    sep = s["2020-08-29":"2020-09-30"]
    z = S.residual_z(metric, sep, b)["2020-09-01":]
    for h in np.arange(2, 60.5, 0.5):
        if alarms_per_day(S.cusum(z, h)[1]) <= 1 / 7:
            return float(h)
    return 60.0


def inject(s: pd.Series, onset, kind, rate, step):
    f = s.copy()
    after = f.index >= onset
    hours = (f.index[after] - onset).total_seconds() / 3600
    f[after] = f[after] + (rate * hours if kind == "drift" else step)
    return f


def rule_flags(metric, series: pd.Series, backup: pd.Series | None, at) -> bool:
    lo = at - pd.Timedelta(hours=24)
    ev = [{"ts": t.strftime("%Y-%m-%dT%H:%M:%SZ"), "zone": "z", "metric": metric, "value": float(v), "unit": "",
           "source": "replay"} for t, v in series[lo:at].dropna().items()]
    if backup is not None:
        ev += [{"ts": t.strftime("%Y-%m-%dT%H:%M:%SZ"), "zone": "z", "metric": BACKUP_NAME[metric], "value": float(v),
                "unit": "", "source": "replay"} for t, v in backup[lo:at].dropna().items()]
    ev.sort(key=lambda e: e["ts"])
    out = quality.check_window(ev, at.strftime("%Y-%m-%dT%H:%M:%SZ"))
    return metric in out["bad_metrics"].get("z", [])


def main():
    b = joblib.load(S.MODEL_FILE)
    # Floor for the band scale: 5th percentile on September, so a perfectly flat band cannot blow z up.
    b["scale_floor"], b["anomaly"] = {}, {}
    for metric in FAULTS:
        b["scale_floor"][metric] = 0.0
    rng = random.Random(SEED)
    report = {}
    for metric, (bfile, rate, step) in FAULTS.items():
        s = primary(metric)
        m = b["models"][metric]["30min"]
        f = S.features(s["2020-09-01":"2020-09-30"])[b["feature_names"]].dropna(subset=["value"])
        band = np.abs(m["q90"].predict(f) - m["q10"].predict(f)) / 2.56
        b["scale_floor"][metric] = float(np.percentile(band, 5))
        h = tune(metric, b)
        b["anomaly"][metric] = {"h": h, "k": S.CUSUM_K}
        backup = S.load_stream(bfile, metric) if bfile else None
        test = s["2020-10-01":"2020-12-30"]
        clean_alarm = S.cusum(S.residual_z(metric, test, b), h)[1]
        hourly = pd.date_range("2020-10-02", "2020-12-29", freq="6h")
        rule_fa = sum(rule_flags(metric, s, backup, t) for t in hourly) / len(hourly)
        res = {"alarm_level_h": h, "learned_false_alarms_per_day": round(alarms_per_day(clean_alarm), 3),
               "rules_flag_rate_on_clean_6h_checks": round(rule_fa, 3)}
        for kind in ("drift", "bias_step"):
            hit_l = hit_r = 0
            delay_l, delay_r = [], []
            for _ in range(EPISODES):
                onset = pd.Timestamp("2020-10-03") + pd.Timedelta(minutes=5 * rng.randrange(0, 288 * 80))
                fs = inject(s, onset, "drift" if kind == "drift" else "step", rate, step)
                seg = fs[onset - pd.Timedelta(hours=36): onset + pd.Timedelta(hours=WINDOW_H)]
                stat, alarm = S.cusum(S.residual_z(metric, seg, b)[onset - pd.Timedelta(hours=12):], h)
                after = alarm[onset:]
                if after.any():
                    hit_l += 1
                    delay_l.append((after.idxmax() - onset).total_seconds() / 60)
                for i, t in enumerate(pd.date_range(onset + pd.Timedelta(minutes=15), periods=WINDOW_H * 4, freq="15min")):
                    if rule_flags(metric, fs, backup, t):
                        hit_r += 1
                        delay_r.append(15 * (i + 1))
                        break
            res[kind] = {"learned_detected": round(hit_l / EPISODES, 2), "rules_detected": round(hit_r / EPISODES, 2),
                         "learned_median_delay_min": float(np.median(delay_l)) if delay_l else None,
                         "rules_median_delay_min": float(np.median(delay_r)) if delay_r else None}
        report[metric] = res
        print(metric, json.dumps(res), flush=True)
    joblib.dump(b, S.MODEL_FILE, compress=3)
    out = {"faults": {m: {"drift_per_hour": r, "bias_step": st, "rules_have_backup_probe": bool(bf)}
                      for m, (bf, r, st) in FAULTS.items()},
           "episodes_per_fault": EPISODES, "window_hours": WINDOW_H, "test": "EDEN ISS Oct-Dec 2020, tank1/feg primary probes",
           "results": report,
           "no_gain": [f"{m} {k}: learned {r[k]['learned_detected']} vs rules {r[k]['rules_detected']}"
                       for m, r in report.items() for k in ("drift", "bias_step") if r[k]["learned_detected"] <= r[k]["rules_detected"]]}
    (ROOT / "bench" / "results" / "sensor_anomaly.json").write_text(json.dumps(out, indent=1))
    print("no gain:", out["no_gain"])


if __name__ == "__main__":
    main()
