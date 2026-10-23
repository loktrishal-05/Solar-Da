"""Forecast-aware irrigation: the agent's decision and the two baselines it is benchmarked against.

Agent: hold if the forecast gives rain; otherwise build three options (hold, irrigate now, irrigate tonight),
run each in the AquaCrop twin, and pick the fewest stress days, then the least water.
Baselines: a fixed schedule, and a rule-based ET controller (FAO-56 Kc x ET0 minus effective rain).
"""
import os
from datetime import date
from functools import lru_cache
from pathlib import Path

import httpx
import yaml

from . import weather

TWIN = os.environ.get("SOLARDA_TWIN", "http://127.0.0.1:8100")
KC_FILE = Path(__file__).resolve().parents[3] / "data" / "kc.yaml"
DEPTH_MM = 20.0          # application depth for one irrigation event
RAIN_HOLD_MM = 5.0       # same threshold as the engine's RAIN_HOLD envelope rule
BIOMASS_GAIN = 0.005     # irrigate if the twin projects >= 0.5% more biomass over the horizon than holding
_client = httpx.Client(timeout=60)


@lru_cache(maxsize=1)
def kc_table(crop: str = "tomato") -> dict:
    return yaml.safe_load(KC_FILE.read_text())[crop]


def kc(days_after_planting: int, crop: str = "tomato") -> float:
    """FAO-56 Kc curve: flat ini, linear dev, flat mid, linear late."""
    t = kc_table(crop)
    s = {k: v["value"] for k, v in t["stages_days"].items()}
    ini, mid, end = t["kc_ini"]["value"], t["kc_mid"]["value"], t["kc_end"]["value"]
    d = days_after_planting
    if d <= s["ini"]:
        return ini
    if d <= s["ini"] + s["dev"]:
        return ini + (mid - ini) * (d - s["ini"]) / s["dev"]
    if d <= s["ini"] + s["dev"] + s["mid"]:
        return mid
    return mid + (end - mid) * min(1.0, (d - s["ini"] - s["dev"] - s["mid"]) / s["late"])


def twin_options(planting: str, today: str, history: list[dict], depth_mm: float = DEPTH_MM) -> list[dict]:
    r = _client.post(f"{TWIN}/twin/options", json={"planting": planting, "today": today, "history": history,
                                                   "depth_mm": depth_mm})
    r.raise_for_status()
    return r.json()


def twin_run(planting: str, until: str, history: list[dict], crop: str = "Tomato", soil: str = "SandyLoam") -> dict:
    r = _client.post(f"{TWIN}/twin/run", json={"planting": planting, "until": until, "irrigation": history,
                                               "crop": crop, "soil": soil})
    r.raise_for_status()
    return r.json()


@lru_cache(maxsize=16)
def _prior(planting: str, before: str, policy: str) -> tuple:
    if policy != "et_controller":
        return ()
    et, d, out = EtController(planting), date.fromisoformat(planting), []
    while d.isoformat() < before:
        mm = et.step(d.isoformat())
        if mm:
            out.append((d.isoformat(), mm))
        d = date.fromordinal(d.toordinal() + 1)
    return tuple(out)


def prior_history(planting: str, before: str, policy: str | None) -> list[dict]:
    """Irrigation before a scenario starts, so the twin does not begin the replay from a starved crop."""
    return [{"date": d, "mm": mm} for d, mm in _prior(planting, before, policy or "")]


def agent_decide(planting: str, today: str, history: list[dict], use_forecast: bool = True) -> dict:
    """Returns {option, depth_mm, rationale, evidence, options}. Evidence cites ET0/forecast and twin run ids."""
    wx = weather.day(today)
    out = weather.outlook(today, 2)
    evidence = [wx["id"]] + (out["ids"] if use_forecast else [])
    if use_forecast and out["rain_mm"] >= RAIN_HOLD_MM:
        return {"option": "hold", "depth_mm": 0.0, "options": [], "evidence": evidence,
                "rationale": f"Hold: {out['rain_mm']} mm rain forecast in the next 2 days ({out['kind']}); "
                             f"ET0 today {wx['et0_fao_evapotranspiration']} mm."}
    opts = twin_options(planting, today, history)
    hold = next(o for o in opts if o["option"] == "hold")
    # Irrigate only if the twin says it pays: fewer stress days, or at least BIOMASS_GAIN more biomass by the
    # end of the horizon (mild stress slows growth before transpiration drops). Otherwise hold and save water.
    worth = [o for o in opts if o["option"] != "hold" and (o["stress_days"] < hold["stress_days"]
             or o.get("biomass", 0) >= hold.get("biomass", 0) * (1 + BIOMASS_GAIN))]
    best = min(worth, key=lambda o: (o["stress_days"], -o.get("biomass", 0), o["option"] != "irrigate_tonight")) if worth else hold
    summary = "; ".join(f"{o['option']}: {o['stress_days']} stress days, biomass {o.get('biomass')}, {o['water_used_mm']} mm"
                        for o in opts)
    return {"option": best["option"], "depth_mm": best["depth_mm"], "options": opts,
            "evidence": evidence + [o["run_id"] for o in opts],
            "rationale": f"ET0 today {wx['et0_fao_evapotranspiration']} mm, rain next 2 days "
                         f"{out['rain_mm'] if use_forecast else 'unknown'} mm. Twin (7-day horizon): {summary}. "
                         f"Chose {best['option']}."}


class EtController:
    """Rule-based baseline: irrigate when cumulative Kc*ET0 minus effective rain passes a depletion threshold."""

    def __init__(self, planting: str, threshold_mm: float = 30.0, depth_mm: float = DEPTH_MM):
        self.planting, self.threshold, self.depth, self.deficit = date.fromisoformat(planting), threshold_mm, depth_mm, 0.0

    def step(self, today: str) -> float:
        wx = weather.day(today)
        etc = kc((date.fromisoformat(today) - self.planting).days) * wx["et0_fao_evapotranspiration"]
        eff_rain = max(0.0, 0.8 * wx["precipitation_sum"] - 2.0)  # ponytail: simple effective-rain rule (USDA-SCS is better)
        self.deficit = max(0.0, self.deficit + etc - eff_rain)
        if self.deficit >= self.threshold:
            self.deficit = max(0.0, self.deficit - self.depth)
            return self.depth
        return 0.0
