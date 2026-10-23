"""Integration fixtures: a real TypeScript API (weiqou/api/dist) on a free port with a temp runtime dir.
Env vars are set at import time, before any test module imports app.runner (which opens the checkpointer)."""
import os
import socket
import subprocess
import tempfile
import time
from pathlib import Path

import httpx
import pytest

ROOT = Path(__file__).resolve().parents[3]
RUNTIME = tempfile.mkdtemp(prefix="solarda-test-")
with socket.socket() as s:
    s.bind(("127.0.0.1", 0))
    PORT = s.getsockname()[1]
os.environ["SOLARDA_RUNTIME_DIR"] = RUNTIME
os.environ["SOLARDA_API"] = f"http://127.0.0.1:{PORT}/api"
os.environ.pop("SOLARDA_LLM", None)  # the gate requires the graph to complete with no LLM


@pytest.fixture(scope="session", autouse=True)
def api_server():
    server = ROOT / "weiqou" / "api" / "dist" / "server.js"
    if not server.exists():
        pytest.skip("build the API first: npm run build")
    proc = subprocess.Popen(["node", str(server)], env={**os.environ, "PORT": str(PORT)},
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for _ in range(50):
        try:
            if httpx.get(f"http://127.0.0.1:{PORT}/api/health").status_code == 200:
                break
        except httpx.HTTPError:
            time.sleep(0.2)
    yield
    proc.terminate()
