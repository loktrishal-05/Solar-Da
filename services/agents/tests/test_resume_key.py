"""Approvals must come through the API (which checks the approver's role) whenever SOLARDA_INTERNAL_KEY is set."""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app, raise_server_exceptions=False)
BODY = {"approvals": [{"proposal_id": "p1", "decision": "approve", "decided_by": "x", "ts": "2020-03-03T06:00:00Z"}]}


def test_resume_without_key_header_is_refused(monkeypatch):
    monkeypatch.setenv("SOLARDA_INTERNAL_KEY", "k1")
    r = client.post("/runs/none:000/resume", json=BODY)
    assert r.status_code == 403
    r = client.post("/runs/none:000/resume", json=BODY, headers={"X-Solarda-Internal": "wrong"})
    assert r.status_code == 403


def test_resume_with_key_header_passes_the_gate(monkeypatch):
    monkeypatch.setenv("SOLARDA_INTERNAL_KEY", "k1")
    r = client.post("/runs/none:000/resume", json=BODY, headers={"X-Solarda-Internal": "k1"})
    assert r.status_code != 403


def test_no_key_configured_keeps_old_behaviour(monkeypatch):
    monkeypatch.delenv("SOLARDA_INTERNAL_KEY", raising=False)
    r = client.post("/runs/none:000/resume", json=BODY)
    assert r.status_code != 403
