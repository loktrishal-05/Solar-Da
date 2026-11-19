"""Client for the TypeScript API. The safety decision is made there (engine invariants); never here.

If the API cannot be reached the gate fails closed: every proposal is vetoed.
"""
import os
from pathlib import Path

import httpx

API = os.environ.get("SOLARDA_API", "http://127.0.0.1:3001/api")
RUNTIME = Path(os.environ.get("SOLARDA_RUNTIME_DIR") or Path(__file__).resolve().parents[3] / "data" / "runtime")
_client = httpx.Client(timeout=10)


def internal_headers() -> dict:
    """Shared key that tells the API this call comes from the agent runtime (dispatch, audit, clearing E-STOP)."""
    key = os.environ.get("SOLARDA_INTERNAL_KEY")
    if not key and (RUNTIME / ".internal_key").exists():
        key = (RUNTIME / ".internal_key").read_text().strip()
    return {"X-Solarda-Internal": key} if key else {}


def safety_check(proposals: list[dict], context: dict) -> list[dict]:
    if not proposals:
        return []
    try:
        r = _client.post(f"{API}/safety/check", json={"proposals": proposals, "context": context})
        r.raise_for_status()
        return r.json()["verdicts"]
    except (httpx.HTTPError, KeyError) as e:
        return [{"proposal_id": p["id"], "verdict": "veto", "invariant": "SAFETY_SERVICE_UNAVAILABLE",
                 "reason": f"Safety check unreachable ({type(e).__name__}); failing closed.", "needs_human": False}
                for p in proposals]


def dispatch(run_id: str, sim_time: str, action: dict, approval: dict | None = None) -> dict:
    """Idempotency key = action id: a resumed run that reaches dispatch again never repeats the action."""
    r = _client.post(f"{API}/actions", headers={"Idempotency-Key": action["id"], **internal_headers()},
                     json={"run_id": run_id, "sim_time": sim_time, "action": action,
                           **({"approval": approval} if approval else {})})
    body = r.json()
    return {"status_code": r.status_code, **body}


def actions() -> list[dict]:
    try:
        return _client.get(f"{API}/actions").json()["actions"]
    except httpx.HTTPError:
        return []


def audit(entry: dict) -> None:
    try:
        _client.post(f"{API}/audit", json=entry, headers=internal_headers())
    except httpx.HTTPError:
        pass  # the agent's own checkpoint still holds the trace


def estop(active: bool) -> bool:
    return _client.post(f"{API}/estop", json={"active": active}, headers=internal_headers()).json()["eStopActive"]


def health() -> bool:
    try:
        return _client.get(f"{API}/health").status_code == 200
    except httpx.HTTPError:
        return False
