"""Event triggers: decide when the farm-shift graph runs, instead of only on a fixed tick.

Checked every 5 minutes of sim time on the replay window. A trigger fires a run when:
  threshold       a reading crosses a planner target (rising edge; re-fires every `still_out_min` while still out)
  quality_fault   a quality check marks a reading bad (new zone/metric/check)
  forecast_breach the learned forecaster expects a limit crossing (central forecast, not just the band)
  anomaly         the learned detector raises an alarm on a probe
  photo           a new leaf photo arrives
  weather         field bed: rain >= the hold threshold in the next 2 days (checked once per sim day; the daily
                  heartbeat already re-plans irrigation with the twin and the soil forecast)
  schedule        heartbeat: the scenario's tick_minutes (kept as a fallback so nothing is ever missed)
  manual          POST /sessions/trigger
De-duplication: one key per (kind, zone, metric) with a cooldown; at most MAX_RUNS_PER_HOUR triggered runs per sim
hour (the heartbeat is never rate-limited). Triggers that fire together share one run. Every run records its triggers.
"""
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from . import irrigation, quality, sensor_models, specialists, weather
from .replay.clock import fmt_ts, parse_ts

COOLDOWN_MIN = {"threshold": 30, "quality_fault": 60, "forecast_breach": 60, "anomaly": 360, "photo": 0, "weather": 1440}
STILL_OUT_MIN = 60
MAX_RUNS_PER_HOUR = 6
MODEL_EVERY_MIN = 15  # forecasts/anomaly are recomputed every 15 sim minutes

# metric -> (low, high) planner targets; crossing one is a threshold trigger
THRESHOLDS = {"ph": specialists.PH_TARGET, "ec": specialists.EC_TARGET, "air_temp": (None, specialists.AIR_TEMP_VENT_C),
              "vpd": (None, specialists.VPD_HIGH_KPA), "level": (specialists.LEVEL_LOW_CM, None),
              "solution_temp": (None, specialists.SOLUTION_TEMP_HIGH_C), "soil_moisture": (25, None)}


def _out(v: float, lim: tuple) -> str | None:
    lo, hi = lim
    if lo is not None and v < lo:
        return "low"
    if hi is not None and v > hi:
        return "high"
    return None


@dataclass
class TriggerEngine:
    scenario: dict
    last_fired: dict = field(default_factory=dict)  # key -> sim datetime
    out_state: dict = field(default_factory=dict)   # (zone, metric) -> "low"/"high"/None
    runs: list = field(default_factory=list)        # sim datetimes of triggered runs
    next_heartbeat: datetime | None = None
    last_model_check: datetime | None = None
    last_weather_day: str | None = None
    manual: list = field(default_factory=list)

    def _cool(self, key: tuple, kind: str, now: datetime, minutes: int | None = None) -> bool:
        last = self.last_fired.get(key)
        return last is None or now - last >= timedelta(minutes=COOLDOWN_MIN[kind] if minutes is None else minutes)

    def _fire(self, out: list, kind: str, zone: str, metric: str, detail: str, now: datetime, minutes: int | None = None):
        key = (kind, zone, metric)
        if self._cool(key, kind, now, minutes):
            self.last_fired[key] = now
            out.append({"kind": kind, "zone": zone, "metric": metric, "detail": detail, "at": fmt_ts(now)})

    def check(self, now: datetime, events: list[dict], prev: datetime | None) -> dict:
        """Returns {"run": bool, "triggers": [...], "heartbeat": bool, "suppressed": [...]}."""
        nows = fmt_ts(now)
        fired: list[dict] = []
        if events:
            q = quality.check_window(events, nows, 5)
            for f in q["quality_flags"]:
                if f["severity"] == "bad" and not f["metric"].endswith("_b"):
                    self._fire(fired, "quality_fault", f["zone"], f"{f['metric']}:{f['check']}", f["detail"], now)
            for zone, ms in q["snapshot"].items():
                for metric, r in ms.items():
                    if metric not in THRESHOLDS or metric in q["bad_metrics"].get(zone, []):
                        continue
                    side = _out(r["value"], THRESHOLDS[metric])
                    was = self.out_state.get((zone, metric))
                    self.out_state[(zone, metric)] = side
                    if side and side != was:
                        self.last_fired.pop(("threshold", zone, metric), None)  # a new crossing always fires
                    if side:
                        self._fire(fired, "threshold", zone, metric, f"{metric} {r['value']} {side} vs target {THRESHOLDS[metric]}",
                                   now, None if side != was else STILL_OUT_MIN)
            if self.last_model_check is None or now - self.last_model_check >= timedelta(minutes=MODEL_EVERY_MIN):
                self.last_model_check = now
                for zone, ms in sensor_models.signals(events, nows, specialists.FORECAST_LIMITS).items():
                    for metric, s in ms.items():
                        for b in s["breaches"]:
                            if b["likely"] and self.out_state.get((zone, metric)) is None:
                                self._fire(fired, "forecast_breach", zone, metric,
                                           f"{metric} forecast {b['forecast']} vs {b['side']} limit {b['limit']} within {b['horizon']}", now)
                        if s["anomaly"] and s["anomaly"]["alarm"]:
                            self._fire(fired, "anomaly", zone, metric, f"anomaly score {s['anomaly']['score']}", now)
        for img in self.scenario.get("images", []):
            if (prev is None or prev < parse_ts(img["at"])) and parse_ts(img["at"]) <= now:
                fired.append({"kind": "photo", "zone": img["zone"], "metric": "leaf_photo", "detail": img["path"], "at": nows})
        f = self.scenario.get("field")
        if f and nows[:10] != self.last_weather_day:
            self.last_weather_day = nows[:10]
            o = weather.outlook(nows[:10], 2)
            if o["rain_mm"] >= irrigation.RAIN_HOLD_MM:
                self._fire(fired, "weather", f["zone"], "rain", f"{o['rain_mm']} mm rain in the next 2 days", now)
        for m in self.manual:
            fired.append({**m, "kind": "manual", "at": nows})
        self.manual = []

        heartbeat = self.next_heartbeat is None or now >= self.next_heartbeat
        if heartbeat:
            self.next_heartbeat = now + timedelta(minutes=self.scenario["tick_minutes"])
        suppressed = []
        hour_ago = now - timedelta(hours=1)
        self.runs = [t for t in self.runs if t > hour_ago]
        if fired and not heartbeat and len(self.runs) >= MAX_RUNS_PER_HOUR:
            urgent = [t for t in fired if t["kind"] in ("photo", "manual", "quality_fault")]
            suppressed = [t for t in fired if t not in urgent]
            fired = urgent
        if fired and not heartbeat:
            self.runs.append(now)
        if heartbeat:
            fired.append({"kind": "schedule", "zone": "*", "metric": "*", "detail": f"every {self.scenario['tick_minutes']} min", "at": nows})
        return {"run": bool(fired), "triggers": fired, "heartbeat": heartbeat, "suppressed": suppressed}
