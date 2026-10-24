"""AquaCrop-OSPy digital twin for field crops. run(option, weather, soil, crop) -> yield, water used, stress days.

The twin replays a season from planting with the irrigation history so far plus one candidate option, then
reports the horizon and season outcome. AquaCrop-OSPy mirrors most of FAO AquaCrop v7.1 but is not an official
FAO tool and has no salinity/fertility stress. All outputs are tagged source="twin".
"""
from datetime import date, timedelta
from functools import lru_cache
from pathlib import Path

import pandas as pd
from aquacrop import AquaCropModel, Crop, InitialWaterContent, IrrigationManagement, Soil

WEATHER = Path(__file__).resolve().parents[3] / "data" / "weather" / "chennai_daily_2021-2023.csv"
STRESS_RATIO = 0.9  # a day counts as water-stressed when transpiration < 90% of potential


@lru_cache(maxsize=1)
def weather_df() -> pd.DataFrame:
    w = pd.read_csv(WEATHER, parse_dates=["time"])
    return pd.DataFrame({"MinTemp": w.temperature_2m_min, "MaxTemp": w.temperature_2m_max,
                         "Precipitation": w.precipitation_sum.fillna(0),
                         "ReferenceET": w.et0_fao_evapotranspiration.clip(lower=0.1), "Date": w.time})


def run(planting: str, until: str, irrigation: list[dict], crop: str = "Tomato", soil: str = "SandyLoam",
        horizon_from: str | None = None) -> dict:
    """Simulate planting..until with a fixed irrigation schedule [{date, mm}]; stress counted from `horizon_from`."""
    p = date.fromisoformat(planting)
    end = date.fromisoformat(until)
    sched = pd.DataFrame({"Date": pd.to_datetime([i["date"] for i in irrigation] or []),
                          "Depth": [float(i["mm"]) for i in irrigation] or []})
    sched = sched.groupby("Date", as_index=False)["Depth"].sum()  # AquaCrop needs one row per day
    m = AquaCropModel(f"{p:%Y/%m/%d}", f"{end + timedelta(days=1):%Y/%m/%d}", weather_df(), Soil(soil),
                      Crop(crop, planting_date=f"{p:%m/%d}"), InitialWaterContent(value=["FC"]),
                      irrigation_management=IrrigationManagement(3, Schedule=sched))
    m.run_model(till_termination=True)
    flux, growth = m.get_water_flux(), m.get_crop_growth()
    days = pd.date_range(p, periods=len(flux)).date
    flux = flux.assign(day=days)
    growth = growth.assign(day=days)
    live = flux[(flux.TrPot > 0) & (flux.day <= end)]
    if horizon_from:
        live = live[live.day >= date.fromisoformat(horizon_from)]
    stressed = int((live.Tr < STRESS_RATIO * live.TrPot).sum())
    g = growth[growth.day <= end]
    last = g.iloc[-1] if len(g) else growth.iloc[-1]
    res = m.get_simulation_results()
    return {
        "water_used_mm": round(sum(float(i["mm"]) for i in irrigation), 1),
        "stress_days": stressed,
        "root_zone_water_mm": round(float(flux[flux.day <= end].Wr.iloc[-1]), 1) if len(flux[flux.day <= end]) else None,
        "canopy_cover": round(float(last.canopy_cover), 3),
        "biomass": round(float(last.biomass), 1),
        "dry_yield_t_ha": round(float(last.DryYield), 3),
        "season_dry_yield_t_ha": round(float(res["Dry yield (tonne/ha)"].iloc[0]), 3) if len(res) else None,
        "source": "twin",
    }


def climatology_weather(today: str) -> pd.DataFrame:
    """Archive weather up to `today`; after it, each day is the mean of the same calendar day in the other
    archive years (no peeking at the season being forecast)."""
    w = weather_df().copy()
    t = pd.Timestamp(today)
    md = w.Date.dt.strftime("%m-%d")
    other = w[w.Date.dt.year != t.year]
    clim = other.groupby(md[other.index]).mean(numeric_only=True)
    future = w.Date > t
    for col in ("MinTemp", "MaxTemp", "Precipitation", "ReferenceET"):
        w.loc[future, col] = md[future].map(clim[col]).values
    return w


def forecast_harvest(planting: str, today: str, crop: str = "Tomato", soil: str = "SandyLoam",
                     weather: str = "climatology") -> dict:
    """Harvest date and yield, assuming irrigation keeps the crop out of water stress from here on
    (soil-moisture trigger at 40% depletion). weather="actual" uses the archive (a perfect forecast)."""
    p = date.fromisoformat(planting)
    w = weather_df() if weather == "actual" else climatology_weather(today)
    m = AquaCropModel(f"{p:%Y/%m/%d}", f"{p.year}/12/31", w, Soil(soil), Crop(crop, planting_date=f"{p:%m/%d}"),
                      InitialWaterContent(value=["FC"]), irrigation_management=IrrigationManagement(1, SMT=[40] * 4))
    m.run_model(till_termination=True)
    r = m.get_simulation_results().iloc[0]
    return {"harvest_date": pd.Timestamp(r["Harvest Date (YYYY/MM/DD)"]).date().isoformat(),
            "season_days": int(r["Harvest Date (Step)"]), "dry_yield_t_ha": round(float(r["Dry yield (tonne/ha)"]), 2),
            "fresh_yield_t_ha": round(float(r["Fresh yield (tonne/ha)"]), 1), "weather": weather,
            "assumption": "irrigated to avoid water stress after today", "source": "twin"}


def compare_options(planting: str, today: str, history: list[dict], depth_mm: float, horizon_days: int = 7,
                    crop: str = "Tomato", soil: str = "SandyLoam") -> list[dict]:
    """The irrigation agent's three options, each run in the twin over the next `horizon_days`."""
    t = date.fromisoformat(today)
    until = (t + timedelta(days=horizon_days)).isoformat()
    options = {"hold": [], "irrigate_now": [{"date": today, "mm": depth_mm}],
               "irrigate_tonight": [{"date": (t + timedelta(days=1)).isoformat(), "mm": depth_mm}]}
    out = []
    for name, extra in options.items():
        r = run(planting, until, history + extra, crop, soil, horizon_from=today)
        out.append({"option": name, "depth_mm": depth_mm if extra else 0.0, **r,
                    "run_id": f"twin:{today}:{name}:{depth_mm:g}mm", "horizon_days": horizon_days})
    return out
