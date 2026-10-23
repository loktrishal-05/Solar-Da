"""Replay sessions: a replay clock drives farm-shift runs every `tick_minutes` of sim time.

One run = one LangGraph execution (thread_id = run_id), checkpointed in SQLite so a run paused for approval
can be resumed after the agent service restarts. Events (telemetry, trace, approval requests) fan out to
SSE subscribers.
"""
import asyncio
import json
import os
import threading
import time
import uuid
from datetime import timedelta
from pathlib import Path

from langgraph.types import Command

from .graphs.farm_shift import build, sqlite_checkpointer
from .replay.adapters import DATASETS, load_events
from .replay.clock import ReplayClock, fmt_ts, parse_ts
from .replay.faults import apply_faults
from .replay.scenario import load_scenario

RUNTIME = Path(os.environ.get("SOLARDA_RUNTIME_DIR") or Path(__file__).resolve().parents[3] / "data" / "runtime")
RUNS_FILE = RUNTIME / "runs.json"
_lock = threading.Lock()
graph = build(sqlite_checkpointer(RUNTIME / "checkpoints.sqlite"))


# ---- event bus -------------------------------------------------------------------------------
class Bus:
    def __init__(self):
        self.subs: list[tuple[asyncio.AbstractEventLoop, asyncio.Queue]] = []
        self.recent: list[dict] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self.subs.append((asyncio.get_running_loop(), q))
        for e in self.recent[-200:]:
            q.put_nowait(e)
        return q

    def unsubscribe(self, q):
        self.subs = [(l, x) for l, x in self.subs if x is not q]

    def publish(self, kind: str, data: dict):
        e = {"type": kind, "data": data}
        self.recent = (self.recent + [e])[-500:]
        for loop, q in list(self.subs):
            loop.call_soon_threadsafe(lambda q=q: q.full() or q.put_nowait(e))


bus = Bus()


# ---- run registry (survives restarts) --------------------------------------------------------
def _load_runs() -> dict:
    return json.loads(RUNS_FILE.read_text()) if RUNS_FILE.exists() else {}


def _save_run(run_id: str, **fields):
    with _lock:
        runs = _load_runs()
        runs[run_id] = {**runs.get(run_id, {}), **fields}
        RUNTIME.mkdir(parents=True, exist_ok=True)
        RUNS_FILE.write_text(json.dumps(runs, indent=1))


def list_runs() -> dict:
    return _load_runs()


def _config(run_id: str) -> dict:
    return {"configurable": {"thread_id": run_id}, "recursion_limit": 60}


def _drive(run_id: str, payload) -> dict:
    """Stream one graph execution (fresh input or Command(resume=...)); publish trace and interrupts."""
    _save_run(run_id, status="running")
    for chunk in graph.stream(payload, _config(run_id), stream_mode="updates"):
        for node, upd in chunk.items():
            if node == "__interrupt__":
                req = upd[0].value
                _save_run(run_id, status="awaiting_approval", approval_request=req)
                bus.publish("approval_request", req)
            elif upd:
                for t in upd.get("trace", []):
                    bus.publish("trace", t)
    snap = graph.get_state(_config(run_id))
    if not snap.next:
        _save_run(run_id, status="done", approval_request=None)
        bus.publish("run_done", {"run_id": run_id})
    return snap.values


def start_run(session_id: str, tick: int, scenario: dict, sim_time: str, autonomy: str) -> dict:
    run_id = f"{session_id}:{tick:03d}"
    _save_run(run_id, session_id=session_id, scenario=scenario["name"], sim_time=sim_time, autonomy=autonomy)
    state = {"run_id": run_id, "session_id": session_id, "site_id": DATASETS[scenario["dataset"]]["site_id"],
             "sim_time": sim_time, "autonomy": autonomy, "scenario": scenario, "attempt": 0}
    bus.publish("run_start", {"run_id": run_id, "sim_time": sim_time})
    return _drive(run_id, state)


def resume_run(run_id: str, approvals: list[dict]) -> dict:
    if _load_runs().get(run_id, {}).get("status") != "awaiting_approval":
        raise ValueError(f"run {run_id} is not awaiting approval")
    return _drive(run_id, Command(resume=approvals))


def run_state(run_id: str) -> dict:
    s = graph.get_state(_config(run_id))
    return {"values": s.values, "next": list(s.next)}


def run_history(run_id: str) -> list[dict]:
    return [{"checkpoint_id": h.config["configurable"]["checkpoint_id"], "next": list(h.next),
             "step": h.metadata.get("step"), "sim_time": h.values.get("sim_time"),
             "trace_len": len(h.values.get("trace", []))}
            for h in graph.get_state_history(_config(run_id))]


# ---- sessions -------------------------------------------------------------------------------
def run_scenario_headless(name: str, autonomy: str | None = None, approve=None, session_id: str | None = None) -> list[dict]:
    """Deterministic, no wall clock: step through the scenario window tick by tick (tests, benchmark)."""
    sc = load_scenario(name)
    session_id = session_id or f"{name}-{uuid.uuid4().hex[:6]}"
    t, end = parse_ts(sc["start"]), parse_ts(sc["end"])
    results, tick = [], 0
    while t < end:
        run_id = f"{session_id}:{tick:03d}"
        vals = start_run(session_id, tick, sc, fmt_ts(t), autonomy or sc["autonomy"])
        if approve and _load_runs()[run_id]["status"] == "awaiting_approval":
            vals = resume_run(run_id, approve(_load_runs()[run_id]["approval_request"]))
        results.append(vals)
        t += timedelta(minutes=sc["tick_minutes"])
        tick += 1
    return results


class Session:
    """Live session: wall-clock driven replay at 1x/60x/1440x, with pause, seek and loop."""

    def __init__(self, name: str, speed: int = 60, autonomy: str | None = None, loop: bool = False):
        self.sc = load_scenario(name)
        self.id = f"{name}-{uuid.uuid4().hex[:6]}"
        self.autonomy = autonomy or self.sc["autonomy"]
        self.clock = ReplayClock(self.sc["start"], self.sc["end"], speed, loop)
        self.tick = 0
        self.next_tick = parse_ts(self.sc["start"])
        self.stopped = False
        self._last_emit = None
        self._events = apply_faults(load_events(self.sc["dataset"], self.sc["start"], self.sc["end"]), self.sc["faults"])
        self.thread = threading.Thread(target=self._loop, daemon=True)

    def info(self) -> dict:
        return {"session_id": self.id, "scenario": self.sc["name"], "description": self.sc.get("description", ""),
                "dataset": DATASETS[self.sc["dataset"]]["label"], "speed": self.clock.speed,
                "paused": self.clock.paused, "sim_time": fmt_ts(self.clock.now()), "start": self.sc["start"],
                "end": self.sc["end"], "autonomy": self.autonomy, "finished": self.clock.finished, "mode": "replay"}

    def _emit_telemetry(self, now: str):
        new = [e for e in self._events if (self._last_emit is None or e["ts"] > self._last_emit) and e["ts"] <= now]
        self._last_emit = now
        latest = {}
        for e in new:
            latest[(e["zone"], e["metric"])] = e
        if latest:
            bus.publish("telemetry", {"sim_time": now, "events": list(latest.values())})

    def _loop(self):
        while not self.stopped:
            now = self.clock.now()
            self._emit_telemetry(fmt_ts(now))
            if now >= self.next_tick and self.next_tick < self.clock.end:
                try:
                    start_run(self.id, self.tick, self.sc, fmt_ts(self.next_tick), self.autonomy)
                except Exception as e:  # keep the session alive; the error is visible in the feed
                    bus.publish("error", {"session_id": self.id, "message": f"{type(e).__name__}: {e}"})
                self.tick += 1
                self.next_tick += timedelta(minutes=self.sc["tick_minutes"])
            bus.publish("clock", self.info())
            if self.clock.finished:
                bus.publish("session_done", {"session_id": self.id})
                break
            time.sleep(1.0)

    def seek(self, ts: str):
        self.clock.seek(ts)
        self.next_tick = parse_ts(ts)
        self._last_emit = None
