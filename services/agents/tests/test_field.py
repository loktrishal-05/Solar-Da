"""Phase 2/3: twin-backed irrigation and the disease agent in the live graph (real API, twin, vision services)."""
import httpx
import pytest

from app import runner, vision_client


def _all(results, key):
    return [x for r in results for x in r.get(key, [])]


def test_field_irrigation_cites_et0_and_twin_runs_and_holds_for_rain():
    res = runner.run_scenario_headless("chennai_field_irrigation", session_id="field-test")
    irrigations = [p for r in res for p in r["plan"] if p["kind"] == "irrigate"]
    assert irrigations, "the agent should irrigate at least once in the dry spell"
    for p in irrigations:  # every irrigation proposal cites its ET0 and twin run ids
        assert any(e.startswith("wx:chennai:") for e in p["evidence"])
        assert sum(e.startswith("twin:") for e in p["evidence"]) == 3
    rain_day = next(r for r in res if r["sim_time"].startswith("2023-03-16"))
    assert not [p for p in rain_day["plan"] if p["kind"] == "irrigate"]
    assert any("rain forecast" in t["data"].get("holds", [{}])[0].get("rationale", "")
               for t in rain_day["trace"] if t["node"] == "arbiter" and t["data"].get("holds"))
    assert all(r["snapshot"]["bed-1"]["root_zone_water"]["source"] == "twin" for r in res)


def _vision_ready():
    try:
        return httpx.get(vision_client.VISION + "/health", timeout=2).json()["model_loaded"]
    except httpx.HTTPError:
        return False


def test_disease_abstains_on_blur_then_treatment_waits_for_human():
    if not _vision_ready():
        pytest.skip("vision model not installed")
    res = runner.run_scenario_headless("diseased_leaf_rain", session_id="disease-test")
    first = [p for p in res[0]["plan"] if p["zone"] == "bed-1"]
    assert any(p["kind"] == "alert" and "retake" in p["params"]["message"].lower() for p in first)
    treat = [v for r in res for v in r["verdicts"] if v["proposal_id"] in
             {p["id"] for p in r["plan"] if p["kind"] == "treat_disease"}]
    assert treat and all(v["needs_human"] for v in treat)
    assert any(r.get("approvals") is None and runner.list_runs()[r["run_id"]]["status"] == "awaiting_approval" for r in res)
