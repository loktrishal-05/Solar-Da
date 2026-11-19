"""Firebase adapter (local-store mode) and the orchestrator report. No network, no LLM key."""
import pytest

from app import firebase_source as fb
from app import orchestrator


@pytest.fixture(autouse=True)
def local_store(tmp_path, monkeypatch):
    monkeypatch.delenv("FIREBASE_DB_URL", raising=False)
    monkeypatch.setattr(fb, "RUNTIME", tmp_path)
    monkeypatch.setenv("SOLARDA_CHAT", "0")  # orchestrator stays rule-based


def test_seed_then_read_tags_every_reading_as_simulated_firebase():
    out = fb.seed("ph_high")
    assert out["written_to"] == "simulated" and out["readings"] == 18
    site = fb.read_site()
    assert {e["source"] for e in site["events"]} == {"firebase-sim"}  # never presented as a real project
    ph = [e for e in site["events"] if e["metric"] == "ph"]
    assert ph[-1]["value"] == 7.1 and site["latest_ts"] == site["events"][-1]["ts"]
    assert [e["ts"] for e in site["events"]] == sorted(e["ts"] for e in site["events"])


def test_reseeding_replaces_the_previous_case():
    fb.seed("ph_high")
    fb.seed("leaf_disease")
    site = fb.read_site()
    assert not [e for e in site["events"] if e["metric"] == "ph"] and len(site["images"]) == 1


def test_command_queue_round_trip():
    fb.queue_command("run:1", {"id": "act-1", "kind": "irrigate", "zone": "bed1", "params": {"minutes": 15}}, "2026-01-01T00:00:00Z")
    c = fb.commands()
    assert c[0]["device"] == "water pump" and c[0]["status"] == "queued" and "Hardware not connected" in c[0]["status_note"]
    fb.clear_commands()
    assert fb.commands() == []


def _values(plan, verdicts, dispatched=(), approvals=()):
    return {"run_id": "r:1", "sim_time": "2026-01-01T00:00:00Z", "snapshot": {"bed1": {"soil_moisture": {"value": 19.4, "unit": "%"}}},
            "weather": {"rain_next_window_mm": 12}, "plan": plan, "verdicts": verdicts, "dispatched": list(dispatched),
            "approvals": list(approvals), "scenario": {"images": []}}


def _p(i, kind, zone="bed1"):
    return {"id": i, "kind": kind, "zone": zone, "params": {"minutes": 15}, "rationale": "soil moisture 19.4% < 30%", "expected_effect": "x"}


def test_report_shows_a_safety_veto_and_a_pending_approval():
    plan = [_p("a", "irrigate"), _p("b", "dose_ph", "tank1")]
    verdicts = [{"proposal_id": "a", "verdict": "veto", "invariant": "RAIN_HOLD", "reason": "Forecast rain 12 mm", "needs_human": False},
                {"proposal_id": "b", "verdict": "allow", "reason": "Inside the safety envelope.", "needs_human": True}]
    r = orchestrator.build(_values(plan, verdicts), "awaiting_approval", "firebase-sim", [])
    o = r["orchestrator"]
    assert (o["blocked"], o["awaiting_approval"], o["dispatched"], o["by"]) == (1, 1, 0, "rules")
    irr = next(a for a in r["agents"] if a["name"].startswith("Irrigation"))
    assert irr["status"] == "held back by safety" and "rain 12" in irr["saw"] and irr["actions"][0]["rule"] == "RAIN_HOLD"
    assert "blocked" in o["summary"].lower()


def test_report_after_approval_lists_hardware_queue():
    hw = {"device": "water pump"}
    plan, verdicts = [_p("a", "irrigate")], [{"proposal_id": "a", "verdict": "allow", "needs_human": True}]
    d = [{"proposal_id": "a", "status_code": 201, "hardware": hw}]
    r = orchestrator.build(_values(plan, verdicts, d, [{"proposal_id": "a", "decision": "approve"}]), "done", "firebase-sim", [hw])
    assert r["orchestrator"]["dispatched"] == 1 and "water pump" in r["orchestrator"]["summary"]
