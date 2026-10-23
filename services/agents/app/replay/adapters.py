"""Dataset adapters: read a committed slice and emit TelemetryEvent dicts (shared contract).

Every event is tagged `source="replay"`; the fault injector re-tags anything it alters as `simulated`.
EDEN ISS is an Antarctic research greenhouse: use it for realistic sensor shape and timing only.
"""
import csv
from functools import lru_cache
from pathlib import Path

SLICES = Path(__file__).resolve().parents[4] / "data" / "replay" / "slices"

DATASETS = {
    "eden_iss": {"file": "eden_iss_2020-03-01_14d.csv", "site_id": "eden-iss-sim",
                 "label": "EDEN ISS 2020 (Antarctic research greenhouse; sensor shape only)", "interval_min": 5},
    "hydrogrownet": {"file": "hydrogrownet_water.csv", "site_id": "hydrogrownet-nft",
                     "label": "HydroGrowNet of Batavia (NFT lettuce, twice-daily water readings)", "interval_min": 240},
}


def event_id(e: dict) -> str:
    return f"tel:{e['zone']}:{e['metric']}:{e['ts']}"


@lru_cache(maxsize=4)
def _load(name: str) -> tuple:
    meta = DATASETS[name]
    with open(SLICES / meta["file"], newline="", encoding="utf-8") as f:
        return tuple(
            {"ts": r["ts"], "siteId": meta["site_id"], "zone": r["zone"], "metric": r["metric"],
             "value": float(r["value"]), "unit": r["unit"], "quality": "ok", "source": "replay"}
            for r in csv.DictReader(f)
        )


def load_events(name: str, start: str | None = None, end: str | None = None) -> list[dict]:
    """Events in [start, end) by dataset time (ISO strings compare correctly)."""
    return [dict(e) for e in _load(name) if (start is None or e["ts"] >= start) and (end is None or e["ts"] < end)]
