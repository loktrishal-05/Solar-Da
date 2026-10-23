"""Weather client over the cached Open-Meteo archive (data/weather/), so the demo needs no network.

    python -m app.weather --fetch     re-download the cache (needs network)
Replay "forecasts" are the archive's actual future values (a perfect forecast) and are labelled as such.
"""
import csv
import json
import sys
import urllib.request
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path

CACHE = Path(__file__).resolve().parents[3] / "data" / "weather" / "chennai_daily_2021-2023.csv"
SITE = {"name": "Chennai", "lat": 13.0827, "lon": 80.2707}
DAILY = ("et0_fao_evapotranspiration,precipitation_sum,temperature_2m_max,temperature_2m_min,"
         "relative_humidity_2m_mean,wind_speed_10m_max,shortwave_radiation_sum")


@lru_cache(maxsize=1)
def daily() -> dict[str, dict]:
    with open(CACHE, newline="", encoding="utf-8") as f:
        return {r["time"]: {k: float(v) if v not in ("", "None") else 0.0 for k, v in r.items() if k != "time"}
                for r in csv.DictReader(f)}


def day(d: str) -> dict:
    return {"date": d, **daily()[d], "id": f"wx:{SITE['name'].lower()}:{d}", "source": "open-meteo-archive"}


def outlook(d: str, days: int = 2) -> dict:
    """Rain and ET0 for the next `days` days after date `d` (perfect forecast from the archive)."""
    start = date.fromisoformat(d)
    nxt = [day((start + timedelta(days=i)).isoformat()) for i in range(1, days + 1)
           if (start + timedelta(days=i)).isoformat() in daily()]
    return {"from": d, "days": days, "rain_mm": round(sum(x["precipitation_sum"] for x in nxt), 1),
            "et0_mm": round(sum(x["et0_fao_evapotranspiration"] for x in nxt), 1), "ids": [x["id"] for x in nxt],
            "kind": "perfect forecast (archive actuals)"}


def fetch(start="2021-01-01", end="2023-12-31"):
    url = (f"https://archive-api.open-meteo.com/v1/archive?latitude={SITE['lat']}&longitude={SITE['lon']}"
           f"&start_date={start}&end_date={end}&daily={DAILY}&timezone=Asia%2FKolkata")
    d = json.load(urllib.request.urlopen(url))["daily"]
    keys = list(d)
    with open(CACHE, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(keys)
        for i in range(len(d["time"])):
            w.writerow([d[k][i] for k in keys])


if __name__ == "__main__" and "--fetch" in sys.argv:
    fetch()
