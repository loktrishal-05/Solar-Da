"""Bad input gets a clear 4xx with a reason, never a 500 or an empty 200."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)


def test_unknown_run_is_404():
    assert client.get("/runs/nope:000/state").status_code == 404
    assert client.get("/runs/nope:000/history").status_code == 404


def test_unknown_scenario_run_is_400_not_500():
    r = client.post("/runs", json={"scenario": "nope"})
    assert r.status_code == 400
    assert "unknown scenario" in r.json()["detail"]


def test_empty_questions_are_rejected():  # 422 is FastAPI's validation status, used across this service
    assert client.post("/advisor/ask", json={"text": "  "}).status_code == 422
    assert client.post("/chat", json={"messages": []}).status_code == 422
