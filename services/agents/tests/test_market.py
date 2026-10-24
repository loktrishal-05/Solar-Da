import pandas as pd

from app import market


def test_outlook_uses_only_past_data():
    s = market.series()
    asof = pd.Timestamp("2020-06-01")
    full = market.outlook_at(asof, 4, s)
    cut = market.outlook_at(asof, 4, s[s.index <= asof])  # future rows removed: identical outlook
    assert full == cut and full["source"].startswith("Agmarknet") and full["data_quality"]


def test_storage_alert_fires_only_on_a_clear_rise():
    base = {"horizon_weeks": 4, "last_rs_qtl": 1000.0, "commodity": "onion", "market": "Bangalore",
            "target_week": "2024-01-01", "source": "x", "data_quality": "ok"}
    assert market.storage_alert({**base, "outlook_rs_qtl": 1050.0}) is None
    a = market.storage_alert({**base, "outlook_rs_qtl": 1200.0})
    assert a["expected_rise_pct"] == 20.0 and "±28%" in a["message"]
    assert market.storage_alert({**base, "horizon_weeks": 1, "outlook_rs_qtl": 1200.0}) is None
