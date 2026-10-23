from fastapi.testclient import TestClient

from app.main import app


def test_health():
    body = TestClient(app).get("/health").json()
    assert body["status"] == "ok" and body["service"] == "agents" and body["llm"] is False
