"""Harvest-date forecast from the twin vs a seasonal-naive baseline (mean season length of the other years).

Truth = the twin run with the season's actual archive weather. Forecasts are made 0, 30, 60 and 90 days after
planting using archive weather up to that day and climatology after it. Simulation only, not field harvests.
Run: services/twin/.venv/Scripts/python -I bench/eval_harvest.py  ->  bench/results/harvest_forecast.json
"""
import json
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "twin"))
from app import twin  # noqa: E402

YEARS, PLANT_MD, LEADS = (2021, 2022, 2023), "01-15", (0, 30, 60, 90)


def main():
    truth = {y: twin.forecast_harvest(f"{y}-{PLANT_MD}", f"{y}-{PLANT_MD}", weather="actual") for y in YEARS}
    rows = []
    for y in YEARS:
        plant = date.fromisoformat(f"{y}-{PLANT_MD}")
        actual = date.fromisoformat(truth[y]["harvest_date"])
        others = [o for o in YEARS if o != y]
        naive_len = sum((date.fromisoformat(truth[o]["harvest_date"]) - date(o, 1, 15)).days for o in others) / len(others)
        naive = plant + timedelta(days=round(naive_len))
        naive_yield = sum(truth[o]["dry_yield_t_ha"] for o in others) / len(others)
        for lead in LEADS:
            today = plant + timedelta(days=lead)
            if today >= actual:
                continue
            f = twin.forecast_harvest(plant.isoformat(), today.isoformat())
            rows.append({"year": y, "days_after_planting": lead, "actual": actual.isoformat(),
                         "twin_forecast": f["harvest_date"], "twin_error_days": (date.fromisoformat(f["harvest_date"]) - actual).days,
                         "naive_forecast": naive.isoformat(), "naive_error_days": (naive - actual).days,
                         "twin_yield_t_ha": f["dry_yield_t_ha"], "actual_yield_t_ha": truth[y]["dry_yield_t_ha"],
                         "naive_yield_t_ha": round(naive_yield, 2),
                         "twin_yield_error": round(f["dry_yield_t_ha"] - truth[y]["dry_yield_t_ha"], 2),
                         "naive_yield_error": round(naive_yield - truth[y]["dry_yield_t_ha"], 2)})
            print(rows[-1])
    mae = lambda k, rs: round(sum(abs(r[k]) for r in rs) / len(rs), 3)
    by_lead = {lead: {"twin_mae_days": mae("twin_error_days", rs), "naive_mae_days": mae("naive_error_days", rs),
                      "twin_yield_mae_t_ha": mae("twin_yield_error", rs), "naive_yield_mae_t_ha": mae("naive_yield_error", rs),
                      "n": len(rs)}
               for lead in LEADS if (rs := [r for r in rows if r["days_after_planting"] == lead])}
    out = {"crop": "Tomato", "planting": PLANT_MD, "weather": "Open-Meteo archive Chennai 2021-2023",
           "truth": "twin with the season's actual weather (simulation, not field harvests)",
           "baseline": "seasonal naive: planting + mean season length of the other years",
           "rows": rows, "mae_by_lead": by_lead,
           "phenology_note": "AquaCrop-OSPy's default Tomato uses calendar-day phenology (maturity 110 days), so the "
                             "harvest date does not depend on weather and any method that knows the crop calendar gets it "
                             "exactly. The informative forecast is yield.",
           "no_gain": [f"{lead} days after planting: twin yield MAE {v['twin_yield_mae_t_ha']} >= naive {v['naive_yield_mae_t_ha']}"
                       for lead, v in by_lead.items() if v["twin_yield_mae_t_ha"] >= v["naive_yield_mae_t_ha"]]
                      + ["harvest date: no gain over the crop calendar (calendar-day phenology)"]}
    (ROOT / "bench" / "results" / "harvest_forecast.json").write_text(json.dumps(out, indent=1))
    print(json.dumps(by_lead, indent=1), out["no_gain"])


if __name__ == "__main__":
    main()
