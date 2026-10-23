"""Phase 1 gate tests: scenarios end to end against the real TypeScript API (see conftest.py)."""
import httpx

from app import api_client, runner
from app.graphs.farm_shift import build, sqlite_checkpointer
from app.replay.scenario import load_scenario


def _all(results, key):
    return [x for r in results for x in r.get(key, [])]


def _audit(run_prefix):
    entries = httpx.get(f"{api_client.API}/audit").json()["entries"]
    return [e for e in entries if str(e.get("run_id", "")).startswith(run_prefix)]


def test_heatwave_end_to_end():
    res = runner.run_scenario_headless("heatwave", session_id="hw-test")
    dispatched = [d for d in _all(res, "dispatched") if d["status_code"] in (200, 201)]
    assert any(d["kind"] == "ventilate" for d in dispatched)
    verdict_ids = {v["proposal_id"] for v in _all(res, "verdicts")}
    audited = {e["proposal_id"] for e in _audit("hw-test") if e["type"] == "dispatched"}
    for d in dispatched:  # every dispatched action has a verdict and an audit entry
        assert d["proposal_id"] in verdict_ids and d["proposal_id"] in audited
    assert all(r["trace"][-1]["node"] == "audit" for r in res)  # every run reached audit


def test_ph_excursion_vetoes_overdose_and_ignores_broken_probe():
    res = runner.run_scenario_headless("ph_excursion", session_id="ph-test")
    kinds = [d["kind"] for d in _all(res, "dispatched") if d["status_code"] in (200, 201)]
    assert "dose_ph" in kinds
    vetoes = [v["invariant"] for v in _all(res, "verdicts") if v["verdict"] == "veto"]
    assert "MAX_DOSE_PER_HOUR" in vetoes, vetoes  # unsafe action vetoed, the trace names the invariant
    assert any("MAX_DOSE_PER_HOUR" in t["summary"] for t in _all(res, "trace") if t["node"] == "safety_gate")
    assert any(f["metric"] == "ph_b" for f in _all(res, "quality_flags"))


def test_sensor_drift_blocks_nutrient_dosing():
    res = runner.run_scenario_headless("sensor_drift", session_id="drift-test")
    assert any(f["metric"] == "ec" and f["severity"] == "bad" for f in _all(res, "quality_flags"))
    assert not [d for d in _all(res, "dispatched") if d["kind"] == "dose_nutrient" and d["status_code"] in (200, 201)]


def test_approval_pause_survives_restart_and_resumes(tmp_path):
    sc = load_scenario("heatwave")
    sim = "2020-03-03T14:00:00Z"  # mid heat ramp: ventilation is proposed
    run_id = "restart-test:000"
    db = tmp_path / "ckpt.sqlite"
    g1 = build(sqlite_checkpointer(db))
    state = {"run_id": run_id, "session_id": "restart-test", "site_id": "eden-iss-sim", "sim_time": sim,
             "autonomy": "propose", "scenario": sc, "attempt": 0}
    cfg = {"configurable": {"thread_id": run_id}}
    g1.invoke(state, cfg)
    pending = g1.get_state(cfg)
    assert pending.next == ("human_approval",)
    request = pending.tasks[0].interrupts[0].value
    assert request["type"] == "approval_request" and request["actions"]

    del g1  # "restart": a new process would build a new graph on the same checkpoint file
    g2 = build(sqlite_checkpointer(db))
    from langgraph.types import Command
    approvals = [{"proposal_id": a["action"]["id"], "decision": "approve", "decided_by": "farmer-test", "ts": sim}
                 for a in request["actions"]]
    out = g2.invoke(Command(resume=approvals), cfg)
    assert not g2.get_state(cfg).next
    assert any(d["status_code"] in (200, 201) for d in out["dispatched"])
    # Resuming again must not repeat the dispatch (idempotency key = action id).
    n = len([a for a in api_client.actions() if a["run_id"] == run_id])
    assert n == len([d for d in out["dispatched"] if d["status_code"] == 201])


def test_verify_failure_stops_at_cap_and_escalates():
    sc = load_scenario("heatwave")
    sc["faults"] = sc["faults"] + [{"type": "pump_failure", "zone": "feg", "metric": "air_temp",
                                    "start": "2020-03-03T00:00:00Z"}]
    g = build()  # in-memory: no checkpointer needed
    out = g.invoke({"run_id": "verify-test:000", "session_id": "verify-test", "site_id": "eden-iss-sim",
                    "sim_time": "2020-03-03T14:00:00Z", "autonomy": "auto_in_envelope", "scenario": sc, "attempt": 0},
                   {"recursion_limit": 60})
    assert out["attempt"] == 2
    assert out["escalations"] and out["escalations"][0]["type"] == "verify_failed"
    assert out["trace"][-1]["node"] == "audit"


def test_estop_freezes_dispatch():
    api_client.estop(True)
    try:
        res = runner.run_scenario_headless("heatwave", session_id="estop-test")
        assert not [d for d in _all(res, "dispatched") if d["status_code"] in (200, 201) and d["kind"] != "alert"]
        assert "SYSTEM_ESTOP_ACTIVE" in {v.get("invariant") for v in _all(res, "verdicts")}
    finally:
        api_client.estop(False)
