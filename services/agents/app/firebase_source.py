"""Firebase as the farm database: the ESP32 writes sensor readings, the agents read them, approved commands go back.

Layout (Firebase Realtime Database, REST):
  /solarda/<site>/readings/<id>   {ts, zone, metric, value, unit}      written by the ESP32 (or the demo seeder)
  /solarda/<site>/images/<id>     {ts, zone, path}                      camera frames (path or Storage URL)
  /solarda/<site>/weather         {rain_next_window_mm, note}           forecast the weather agent last stored
  /solarda/<site>/commands/<id>   {kind, zone, params, status, ...}     written by the dispatch node, read by the ESP32

With FIREBASE_DB_URL set (e.g. https://my-project-default-rtdb.firebaseio.com, plus optional FIREBASE_AUTH) it talks to the
real database. Without it, a local JSON file with the same layout stands in, and every reading is tagged source
"firebase-sim" so the UI never presents it as a real Firebase project.
ponytail: REST polling on button press, not a streaming listener; add SSE (Accept: text/event-stream) when the ESP32 is live.
"""
import json
import os
import threading
import time
import urllib.request
from datetime import UTC, datetime, timedelta
from pathlib import Path

SITE = "demo-farm"
RUNTIME = Path(os.environ.get("SOLARDA_RUNTIME_DIR") or Path(__file__).resolve().parents[3] / "data" / "runtime")
_lock = threading.Lock()


def _base() -> str:
    return os.environ.get("FIREBASE_DB_URL", "").strip().rstrip("/")


def mode() -> str:
    return "firebase" if _base() else "simulated"


def source_tag() -> str:
    return "firebase" if _base() else "firebase-sim"


# ---- storage: Firebase REST, or a local file with the same tree ---------------------------------------------------
def _rest(method: str, path: str, body=None):
    url = f"{_base()}/{path.strip('/')}.json" + (f"?auth={os.environ['FIREBASE_AUTH']}" if os.environ.get("FIREBASE_AUTH") else "")
    req = urllib.request.Request(url, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=10).read() or "null")


def _file() -> Path:
    return RUNTIME / "firebase_sim.json"


def _tree() -> dict:
    return json.loads(_file().read_text()) if _file().exists() else {}


def get(path: str):
    if _base():
        return _rest("GET", path)
    node = _tree()
    for k in [p for p in path.strip("/").split("/") if p]:
        node = node.get(k) if isinstance(node, dict) else None
    return node


def put(path: str, value) -> None:
    if _base():
        _rest("PUT", path, value)
        return
    with _lock:
        tree = _tree()
        keys = [p for p in path.strip("/").split("/") if p]
        node = tree
        for k in keys[:-1]:
            node = node.setdefault(k, {})
        if value is None:
            node.pop(keys[-1], None)
        else:
            node[keys[-1]] = value
        RUNTIME.mkdir(parents=True, exist_ok=True)
        _file().write_text(json.dumps(tree, indent=1))


# ---- the four demo cases: what the ESP32 would have written ----------------------------------------------------------
# Each reading series is oldest -> newest, 5 minutes apart, ending "now".
CASES = {
    "dry_soil": {
        "title": "Dry soil, no rain coming",
        "story": "The soil-moisture sensor drops below 30 % and the forecast is dry. The irrigation agent should water.",
        "series": {("bed1", "soil_moisture", "%"): [31.5, 29.8, 27.0, 24.6, 22.0, 19.4], ("tank1", "level", "cm"): [38, 38, 37.9, 37.9, 37.8, 37.8]},
        "weather": {"rain_next_window_mm": 0.0, "note": "dry for the next 24 h"},
    },
    "rain_hold": {
        "title": "Dry soil, but heavy rain is forecast",
        "story": "Soil is dry again, but 12 mm of rain is coming. The safety engine should veto watering and the farmer saves water.",
        "series": {("bed1", "soil_moisture", "%"): [32.0, 30.2, 28.1, 26.0, 24.0, 22.5], ("tank1", "level", "cm"): [38, 38, 38, 37.9, 37.9, 37.9]},
        "weather": {"rain_next_window_mm": 12.0, "note": "thunderstorm expected in 3 h"},
    },
    "ph_high": {
        "title": "pH too high",
        "story": "The tank pH climbs to 7.1 while nutrients are fine. The fertigation agent should dose pH-down.",
        "series": {("tank1", "ph", "pH"): [6.3, 6.5, 6.7, 6.9, 7.0, 7.1], ("tank1", "ec", "mS/cm"): [1.8, 1.8, 1.8, 1.7, 1.8, 1.8],
                   ("tank1", "level", "cm"): [38, 38, 37.9, 37.9, 37.8, 37.8]},
        "weather": {"rain_next_window_mm": 0.0, "note": "dry for the next 24 h"},
    },
    "nutrient_low": {
        "title": "Nutrients (potassium mix) running low",
        "story": "pH is fine but EC (nutrient strength) falls to 1.0. The fertigation agent should dose nutrients.",
        "series": {("tank1", "ph", "pH"): [6.1, 6.1, 6.1, 6.0, 6.1, 6.1], ("tank1", "ec", "mS/cm"): [1.6, 1.5, 1.3, 1.2, 1.1, 1.0],
                   ("tank1", "level", "cm"): [38, 38, 37.9, 37.9, 37.8, 37.8]},
        "weather": {"rain_next_window_mm": 0.0, "note": "dry for the next 24 h"},
    },
    "leaf_disease": {
        "title": "Camera sees a diseased leaf",
        "story": "The camera uploads a tomato leaf with late blight. The disease agent should diagnose it and ask a human before any treatment.",
        "series": {("bed1", "soil_moisture", "%"): [41, 41.2, 40.9, 41, 40.8, 41], ("tank1", "level", "cm"): [38, 38, 38, 38, 37.9, 37.9]},
        "weather": {"rain_next_window_mm": 0.0, "note": "dry for the next 24 h"},
        "image": "data/demo_images/tomato_late_blight_plantvillage.jpg",
    },
}


def _iso(t: datetime) -> str:
    return t.strftime("%Y-%m-%dT%H:%M:%SZ")


def seed(case: str) -> dict:
    """Stand in for the ESP32: replace the site's readings/images/weather with one demo case."""
    c = CASES[case]
    now = datetime.now(UTC).replace(microsecond=0)
    readings = {}
    for (zone, metric, unit), values in c["series"].items():
        for i, v in enumerate(values):
            ts = now - timedelta(minutes=5 * (len(values) - 1 - i))
            readings[f"{zone}-{metric}-{int(ts.timestamp())}"] = {"ts": _iso(ts), "zone": zone, "metric": metric, "value": v, "unit": unit}
    images = {f"img-{int(now.timestamp())}": {"ts": _iso(now), "zone": "bed1", "path": c["image"]}} if c.get("image") else {}
    for key, val in (("readings", readings), ("images", images or None), ("weather", {**c["weather"], "ts": _iso(now)})):
        put(f"solarda/{SITE}/{key}", val)
    return {"case": case, "readings": len(readings), "images": len(images), "weather": c["weather"], "written_to": mode(), "ts": _iso(now)}


def read_site() -> dict:
    """Everything the agents need, as telemetry events + images + weather. Raises if the database is unreachable."""
    node = get(f"solarda/{SITE}") or {}
    tag = source_tag()
    events = sorted(({"ts": r["ts"], "siteId": SITE, "zone": r["zone"], "metric": r["metric"], "value": r["value"],
                      "unit": r.get("unit", ""), "quality": "ok", "source": tag} for r in (node.get("readings") or {}).values()),
                    key=lambda e: e["ts"])
    images = sorted(((i for i in (node.get("images") or {}).values())), key=lambda i: i["ts"])
    return {"events": events, "images": [{"zone": i["zone"], "at": i["ts"], "path": i["path"]} for i in images],
            "weather": node.get("weather") or {}, "latest_ts": events[-1]["ts"] if events else None, "source": tag}


# ---- commands: dispatch writes them, the ESP32 will read them ----------------------------------------------------------
HARDWARE = {"irrigate": "water pump", "dose_ph": "pH dispenser", "dose_nutrient": "nutrient (potassium) dispenser",
            "ventilate": "vent fan", "shade": "shade screen", "treat_disease": "treatment line (human-prescribed)"}


def queue_command(run_id: str, action: dict, ts: str) -> dict:
    """Write an approved action where the ESP32 will pick it up. Status stays 'queued' until hardware acknowledges."""
    cmd = {"run_id": run_id, "action_id": action["id"], "kind": action["kind"], "zone": action["zone"], "params": action["params"],
           "device": HARDWARE.get(action["kind"], action["kind"]), "ts": ts, "status": "queued",
           "status_note": "Hardware not connected yet: the ESP32 will pick this up from Firebase when it is online."}
    put(f"solarda/{SITE}/commands/{action['id']}", cmd)
    return cmd


def commands() -> list[dict]:
    return sorted((get(f"solarda/{SITE}/commands") or {}).values(), key=lambda c: c["ts"], reverse=True)


def clear_commands() -> None:
    put(f"solarda/{SITE}/commands", None)


def wall_ms() -> int:
    return int(time.time() * 1000)
