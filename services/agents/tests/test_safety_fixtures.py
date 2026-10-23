"""The shared safety fixtures (packages/contracts/fixtures/safety_cases.json) through the Python client and the
real API, so both sides agree. Cases that need prior action history are covered by the engine test only."""
import json
from pathlib import Path

import pytest

from app import api_client
from app.models import SafetyVerdict

FX = json.loads((Path(__file__).resolve().parents[3] / "packages/contracts/fixtures/safety_cases.json").read_text())


@pytest.mark.parametrize("case", [c for c in FX["cases"] if not c["context"].get("history")], ids=lambda c: c["name"])
def test_case_via_api(case):
    ctx = {**FX["base_context"], **case["context"]}
    t, p = ctx["telemetry"], case["proposal"]
    api_ctx = {"sim_time": "2020-03-01T00:00:00Z", "autonomy": ctx["autonomy"], "crop": "Butterhead Lettuce",
               "zones": {p["zone"]: {"ph": t["ph"], "ec": t["ecMsCm"], "solution_temp": t["solutionTempC"], "level_mm": t["levelMm"]}},
               "bad_metrics": {p["zone"]: ctx["badMetrics"]}, "rain_next_window_mm": ctx["rainNextWindowMm"]}
    api_client.estop(ctx["eStopActive"])
    try:
        [v] = api_client.safety_check([p], api_ctx)
    finally:
        api_client.estop(False)
    SafetyVerdict.model_validate(v)  # API output matches the shared contract
    assert v["verdict"] == case["expect"]["verdict"], v
    if "invariant" in case["expect"]:
        assert v["invariant"] == case["expect"]["invariant"]
    if "needs_human" in case["expect"]:
        assert v["needs_human"] == case["expect"]["needs_human"]


def test_fails_closed_when_api_unreachable(monkeypatch):
    monkeypatch.setattr(api_client, "API", "http://127.0.0.1:1/api")
    [v] = api_client.safety_check([FX["cases"][0]["proposal"]], {})
    assert v["verdict"] == "veto" and v["invariant"] == "SAFETY_SERVICE_UNAVAILABLE"
