"""Price outlook for the cached weekly Agmarknet series (data/market/onion_bangalore_weekly.csv).

Outlook = last observed price x damped seasonal ratio (median price of the target week-of-year / median of the
current week-of-year, both from earlier years only). Benchmarked against seasonal naive (same week last year) and last value
in bench/eval_price.py. Every outlook carries the series' data-quality label and its source.
"""
from functools import lru_cache
from pathlib import Path

import pandas as pd

SERIES = Path(__file__).resolve().parents[3] / "data" / "market" / "onion_bangalore_weekly.csv"
SOURCE = "Agmarknet via Mendeley onion 2014-2024 (CC BY 4.0), Bangalore market, weekly median modal price"


@lru_cache(maxsize=1)
def series() -> pd.DataFrame:
    s = pd.read_csv(SERIES, parse_dates=["week_start"]).set_index("week_start")
    s["woy"] = s.index.isocalendar().week.clip(upper=52).astype(int)
    return s


def _ratio(hist: pd.DataFrame, now_woy: int, target_woy: int) -> float:
    med = hist.groupby("woy").modal_price_rs_qtl.median()
    a, b = med.get(now_woy), med.get(target_woy)
    return float(b / a) if a and b else 1.0


def outlook_at(asof: pd.Timestamp, horizon_weeks: int, s: pd.DataFrame | None = None) -> dict | None:
    """Forecast for asof + horizon using only data up to `asof`."""
    s = series() if s is None else s
    hist = s[(s.index <= asof) & s.modal_price_rs_qtl.notna()]
    if len(hist) < 104:
        return None
    last_t, last = hist.index[-1], float(hist.modal_price_rs_qtl.iloc[-1])
    target = last_t + pd.Timedelta(weeks=horizon_weeks)
    target_woy = min(int(target.isocalendar().week), 52)
    earlier = hist[hist.index <= last_t - pd.Timedelta(weeks=52)]  # seasonal shape from earlier years only
    # Seasonal ratio damped toward 1. Weight chosen on 2016-2018 only (bench/eval_price.py scores 2019-2024):
    # at 1 week the last value wins outright, at 4 weeks a 0.25 weight helped slightly.
    ratio = _ratio(earlier, int(hist.woy.iloc[-1]), target_woy) ** (0.0 if horizon_weeks <= 1 else 0.25)
    year_ago = hist[(hist.index > target - pd.Timedelta(weeks=53)) & (hist.index <= target - pd.Timedelta(weeks=51))]
    recent = s[(s.index <= asof)].tail(8)
    return {"asof": last_t.date().isoformat(), "target_week": target.date().isoformat(), "horizon_weeks": horizon_weeks,
            "outlook_rs_qtl": round(last * ratio, 0), "last_rs_qtl": last,
            "seasonal_naive_rs_qtl": float(year_ago.modal_price_rs_qtl.iloc[0]) if len(year_ago) else None,
            "data_quality": "ok" if (recent.quality == "ok").all() else f"{int((recent.quality != 'ok').sum())} of last 8 weeks gap/sparse",
            "commodity": "onion", "market": "Bangalore", "source": SOURCE,
            "caveat": "Historical archive (ends 2024-12-30), not today's prices; outlook is a seasonal ratio, not advice."}


def latest_outlook(horizon_weeks: int = 4) -> dict | None:
    return outlook_at(series().index[-1], horizon_weeks)


TYPICAL_ERROR_PCT_4W = 27.8  # bench/results/price_outlook.json, 4-week MAPE 2019-2024
STORAGE_TRIGGER_PCT = 10.0


def storage_alert(o: dict | None) -> dict | None:
    """Storage/pooling alert from a 4-week outlook. Fires only on an expected rise >= 10%, and always states the
    model's typical error, because a 4-week outlook is wrong by ~28% on average."""
    if not o or o["horizon_weeks"] < 4:
        return None
    rise = (o["outlook_rs_qtl"] / o["last_rs_qtl"] - 1) * 100
    if rise < STORAGE_TRIGGER_PCT:
        return None
    return {"kind": "storage_or_pooling", "expected_rise_pct": round(rise, 1), "typical_error_pct": TYPICAL_ERROR_PCT_4W,
            "message": (f"{o['commodity'].title()} at {o['market']} may rise ~{rise:.0f}% by {o['target_week']} "
                        f"(typical outlook error ±{TYPICAL_ERROR_PCT_4W:.0f}%). If you can store safely with losses well below "
                        f"{rise:.0f}%, or pool lots with neighbours to sell later, it may pay. Check your local mandi first."),
            "source": o["source"], "data_quality": o["data_quality"]}
