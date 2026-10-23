"""Scenario packs: YAML files in data/scenarios/ (dataset window, weather, faults, expected behaviour)."""
from pathlib import Path

import yaml

SCENARIOS = Path(__file__).resolve().parents[4] / "data" / "scenarios"


def list_scenarios() -> list[str]:
    return sorted(p.stem for p in SCENARIOS.glob("*.yaml"))


def load_scenario(name: str) -> dict:
    path = SCENARIOS / f"{name}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"unknown scenario {name}; have {list_scenarios()}")
    s = yaml.safe_load(path.read_text(encoding="utf-8"))
    s.setdefault("faults", [])
    s.setdefault("weather", {})
    s.setdefault("autonomy", "auto_in_envelope")
    s.setdefault("tick_minutes", 30)
    s["name"] = name
    return s
