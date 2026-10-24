"""Agent runtime API (FastAPI). Replay control, farm-shift runs, approvals, E-STOP, SSE stream."""
import asyncio
import os
import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from . import api_client, llm, runner
from .graphs import advisor
from .models import Approval
from .replay.scenario import list_scenarios, load_scenario

app = FastAPI(title="Solarda agent runtime")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
session: runner.Session | None = None


@app.get("/health")
def health():
    return {"status": "ok", "service": "agents", "llm": llm.enabled(), "chat": llm.chat_enabled() and llm.CHAT_MODEL, "api": api_client.health()}


class ReplayStart(BaseModel):
    scenario: str
    speed: int = 60
    autonomy: str | None = None
    loop: bool = False


@app.on_event("startup")
def _autostart():
    """Start a looping replay so the assistant and dashboard have (labelled, replayed) data without a manual click."""
    global session
    if os.environ.get("SOLARDA_AUTOSTART", "1") == "1" and not session:
        try:
            session = runner.Session(os.environ.get("SOLARDA_AUTOSTART_SCENARIO", "chennai_field_irrigation"), 60, None, True)
            session.thread.start()
        except Exception:
            session = None  # no scenario files (fresh clone without data): stay idle


@app.get("/scenarios")
def scenarios():
    return [{k: load_scenario(n).get(k) for k in ("name", "description", "dataset", "start", "end", "autonomy")}
            for n in list_scenarios()]


@app.post("/replay/start")
def replay_start(req: ReplayStart):
    global session
    if session:
        session.stopped = True
    try:
        session = runner.Session(req.scenario, req.speed, req.autonomy, req.loop)
    except (FileNotFoundError, ValueError) as e:
        raise HTTPException(400, str(e))
    session.thread.start()
    return session.info()


def _session() -> runner.Session:
    if not session:
        raise HTTPException(404, "no replay session; POST /replay/start first")
    return session


@app.post("/replay/pause")
def replay_pause(paused: bool = True):
    s = _session()
    s.clock.pause() if paused else s.clock.resume()
    return s.info()


class Seek(BaseModel):
    ts: str


@app.post("/replay/seek")
def replay_seek(req: Seek):
    s = _session()
    try:
        s.seek(req.ts)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return s.info()


@app.post("/replay/speed")
def replay_speed(speed: int):
    s = _session()
    try:
        s.clock.set_speed(speed)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return s.info()


class ManualTrigger(BaseModel):
    detail: str = Field("operator asked for a check", max_length=200)
    zone: str = Field("*", max_length=40)


@app.post("/replay/trigger")
def replay_trigger(req: ManualTrigger):
    """Ask the agent to run now (fires at the next 5-min trigger check, sim time)."""
    s = _session()
    s.manual_trigger(req.detail, req.zone)
    return {"queued": True, **s.info()}


@app.get("/replay/state")
def replay_state():
    return session.info() if session else {"mode": "replay", "session_id": None}


@app.get("/replay/stream")
async def replay_stream():
    q = runner.bus.subscribe()

    async def gen():
        try:
            while True:
                e = await q.get()
                yield {"event": e["type"], "data": json.dumps(e["data"], default=str)}
        except asyncio.CancelledError:
            runner.bus.unsubscribe(q)
            raise

    return EventSourceResponse(gen(), ping=15)


class RunStart(BaseModel):
    scenario: str
    autonomy: str | None = None
    sim_time: str | None = None


@app.post("/runs")
def runs_start(req: RunStart):
    """One farm shift at a given sim time (default: the live session's clock, else the scenario start)."""
    sc = load_scenario(req.scenario)
    sim_time = req.sim_time or (session.info()["sim_time"] if session and session.sc["name"] == req.scenario else sc["start"])
    sid = session.id if session and session.sc["name"] == req.scenario else f"{req.scenario}-manual"
    tick = len([r for r in runner.list_runs() if r.startswith(sid + ":")]) + 500
    runner.start_run(sid, tick, sc, sim_time, req.autonomy or sc["autonomy"])
    return {"run_id": f"{sid}:{tick:03d}", **runner.list_runs()[f"{sid}:{tick:03d}"]}


@app.get("/runs")
def runs_list():
    return runner.list_runs()


@app.get("/runs/{run_id}/state")
def run_state(run_id: str):
    return runner.run_state(run_id)


@app.get("/runs/{run_id}/history")
def run_history(run_id: str):
    return runner.run_history(run_id)


class Resume(BaseModel):
    approvals: list[Approval]


@app.post("/runs/{run_id}/resume")
def run_resume(run_id: str, req: Resume):
    try:
        values = runner.resume_run(run_id, [a.model_dump(mode="json", exclude_none=True) for a in req.approvals])
    except ValueError as e:
        raise HTTPException(409, str(e))
    return {"run_id": run_id, **runner.list_runs()[run_id], "dispatched": values.get("dispatched", [])}


class EStop(BaseModel):
    active: bool = True


@app.post("/runs/{run_id}/estop")
@app.post("/estop")
def estop(req: EStop, run_id: str | None = None):
    active = api_client.estop(req.active)
    runner.bus.publish("estop", {"active": active, "run_id": run_id})
    return {"eStopActive": active}


class Ask(BaseModel):
    text: str
    language: str | None = None


@app.post("/advisor/ask")
def advisor_ask(req: Ask):
    return advisor.ask(req.text, req.language)


BENCH = Path(__file__).resolve().parents[3] / "bench" / "results"


@app.get("/bench/results")
def bench_results():
    """Benchmark tables for the web page (simulation results; raw files in bench/results/)."""
    import csv
    out = {"irrigation": [], "advisor": None, "vision": None}
    f = BENCH / "irrigation_results.csv"
    if f.exists():
        out["irrigation"] = list(csv.DictReader(f.open(encoding="utf-8")))
    a = BENCH / "advisor_golden.json"
    if a.exists():
        out["advisor"] = json.loads(a.read_text(encoding="utf-8"))["summary"]
    v = BENCH.parents[1] / "services" / "vision" / "model" / "metrics.json"
    if v.exists():
        out["vision"] = json.loads(v.read_text(encoding="utf-8"))
    for key, name in (("vision_field", "vision_field.json"), ("harvest", "harvest_forecast.json"),
                      ("price", "price_outlook.json"), ("sensor_forecast", "sensor_forecast.json"),
                      ("sensor_anomaly", "sensor_anomaly.json"), ("soil", "soil_forecast.json")):
        p = BENCH / name
        out[key] = json.loads(p.read_text(encoding="utf-8")) if p.exists() else None
    s = BENCH / "summary.md"
    out["summary_md"] = s.read_text(encoding="utf-8") if s.exists() else ""
    return out


class ChatMessage(BaseModel):
    role: str = Field(pattern="^(user|assistant)$")
    content: str = Field(max_length=4000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(max_length=40)
    language: str | None = Field(None, pattern="^(en|ta|hi|te|kn|ml)$")
    mode: str = Field("chat", pattern="^(chat|guide)$")


def _chat_trigger(reason: str) -> bool:
    if not session or session.clock.finished:
        return False
    session.manual_trigger(f"farmer asked in chat: {reason}")
    return True


@app.post("/chat")
def chat_once(req: ChatRequest):
    """Farm assistant, one JSON reply (tests, red team). The UI uses /chat/stream."""
    from . import chat

    return chat.ask([m.model_dump() for m in req.messages], req.language, _chat_trigger, req.mode)


@app.post("/chat/stream")
def chat_stream(req: ChatRequest):
    """Farm assistant, server-sent events: meta, tool, token, retract, done."""
    from fastapi.responses import StreamingResponse

    from . import chat

    def gen():
        try:
            for e in chat.stream([m.model_dump() for m in req.messages], req.language, _chat_trigger, req.mode):
                yield f"event: {e['type']}\ndata: {json.dumps(e, default=str)}\n\n"
        except Exception as e:  # never leave the client hanging
            yield f"event: error\ndata: {json.dumps({'message': type(e).__name__})}\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})


@app.get("/models/status")
def models_status():
    """Which learned models are installed, and what they cover."""
    from . import sensor_models as S

    b = S.bundle()
    return {"sensor_models": {"installed": b is not None, "version": b and b.get("version"),
                              "forecast_metrics": sorted(b["models"]) if b else [],
                              "anomaly_metrics": sorted(b.get("anomaly", {})) if b else []},
            "soil_model": {"installed": S.soil_bundle() is not None},
            "fetch": "scripts/fetch_sensor_models.ps1"}


@app.get("/market/outlook")
def market_outlook(horizon_weeks: int = 4):
    """Price outlook from the cached Agmarknet series, with its data-quality label and a storage/pooling alert."""
    from . import market

    o = market.latest_outlook(horizon_weeks)
    return {"outlook": o, "alert": market.storage_alert(o)}
