"""Simulate tomato seasons in the AquaCrop twin with randomised irrigation, for the soil-water forecaster.

Daily rows: root-zone water (Wr, mm), total available water proxy, ET0, rain, irrigation, days after planting.
Simulation data, labelled as such everywhere it is used. Seeded and reproducible.
Run: services/twin/.venv/Scripts/python -I bench/gen_soil_seasons.py  ->  data/raw/soil_seasons.csv
"""
import random
import sys
from datetime import date, timedelta
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "twin"))
from aquacrop import AquaCropModel, Crop, InitialWaterContent, IrrigationManagement, Soil  # noqa: E402
from app import twin  # noqa: E402

SEED, SEASONS_PER_YEAR = 1337, 24
SOILS = ["SandyLoam", "Loam", "ClayLoam"]


def season(year: int, rng: random.Random, i: int) -> pd.DataFrame:
    p = date(year, 1, 1) + timedelta(days=rng.randrange(0, 45))
    soil = SOILS[i % len(SOILS)]
    every, depth = rng.choice([2, 3, 4, 5, 7, 10]), rng.choice([10, 15, 20, 25, 30])
    sched = [{"date": (p + timedelta(days=d)).isoformat(), "mm": depth * rng.choice([0, 1, 1, 1])}
             for d in range(rng.randrange(0, every), 120, every)]
    sched = [s for s in sched if s["mm"] > 0]
    sdf = pd.DataFrame({"Date": pd.to_datetime([s["date"] for s in sched]), "Depth": [s["mm"] for s in sched]})
    m = AquaCropModel(f"{p:%Y/%m/%d}", f"{p + timedelta(days=130):%Y/%m/%d}", twin.weather_df(), Soil(soil),
                      Crop("Tomato", planting_date=f"{p:%m/%d}"), InitialWaterContent(value=["FC"]),
                      irrigation_management=IrrigationManagement(3, Schedule=sdf))
    m.run_model(till_termination=True)
    flux = m.get_water_flux()
    days = pd.date_range(p, periods=len(flux))
    w = twin.weather_df().set_index("Date")
    irr = sdf.set_index("Date").Depth.reindex(days, fill_value=0).values
    out = pd.DataFrame({"season": f"{year}-{i}", "year": year, "soil": soil, "date": days, "dap": range(len(flux)),
                        "wr": flux.Wr.values, "et0": w.ReferenceET.reindex(days).values,
                        "rain": w.Precipitation.reindex(days).values, "irrigation": irr,
                        "tr": flux.Tr.values, "trpot": flux.TrPot.values})
    return out[out.trpot > 0]  # crop in the ground


def main():
    rng = random.Random(SEED)
    rows = [season(y, rng, i) for y in (2021, 2022, 2023) for i in range(SEASONS_PER_YEAR)]
    d = pd.concat(rows)
    (ROOT / "data" / "raw").mkdir(parents=True, exist_ok=True)
    d.to_csv(ROOT / "data" / "raw" / "soil_seasons.csv", index=False)
    print(d.shape, d.season.nunique())


if __name__ == "__main__":
    main()
