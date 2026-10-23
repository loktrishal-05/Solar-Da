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


def _free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


PORT, TWIN_PORT, VISION_PORT = _free_port(), _free_port(), _free_port()
os.environ["SOLARDA_RUNTIME_DIR"] = RUNTIME
os.environ["SOLARDA_API"] = f"http://127.0.0.1:{PORT}/api"
os.environ["SOLARDA_TWIN"] = f"http://127.0.0.1:{TWIN_PORT}"
os.environ["SOLARDA_VISION"] = f"http://127.0.0.1:{VISION_PORT}"


def _wait(url: str):
    for _ in range(100):
        try:
            if httpx.get(url, timeout=2).status_code == 200:
                return
        except httpx.HTTPError:
            time.sleep(0.2)
os.environ.pop("SOLARDA_LLM", None)  # the gate requires the graph to complete with no LLM


@pytest.fixture(scope="session", autouse=True)
def api_server():
    server = ROOT / "weiqou" / "api" / "dist" / "server.js"
    if not server.exists():
        pytest.skip("build the API first: npm run build")
    procs = [subprocess.Popen(["node", str(server)], env={**os.environ, "PORT": str(PORT)},
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)]
    # Python services, each in its own venv (twin: AquaCrop; vision: ONNX classifier).
    for svc, port in (("twin", TWIN_PORT), ("vision", VISION_PORT)):
        py = ROOT / "services" / svc / ".venv" / "Scripts" / "python.exe"
        if py.exists():
            procs.append(subprocess.Popen([str(py), "-m", "uvicorn", "app.main:app", "--port", str(port)],
                                          cwd=ROOT / "services" / svc, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
    _wait(f"http://127.0.0.1:{PORT}/api/health")
    _wait(os.environ["SOLARDA_TWIN"] + "/health")
    _wait(os.environ["SOLARDA_VISION"] + "/health")
    yield
    for p in procs:
        p.terminate()
