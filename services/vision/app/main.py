"""Vision service: POST /vision/classify (leaf image -> label with calibrated confidence, or abstain)."""
from fastapi import FastAPI, File, HTTPException, UploadFile

from . import classifier

app = FastAPI(title="Solarda vision")
# No CORS middleware: the web app reaches this service through the same origin (Vite proxy, nginx, Vercel proxy).
MAX_BYTES = 10 * 1024 * 1024


@app.get("/health")
def health():
    return {"status": "ok", "service": "vision", "model_loaded": classifier.available()}


@app.get("/vision/metrics")
def metrics():
    return classifier.metrics()


@app.post("/vision/classify")
async def classify(image: UploadFile = File(...)):
    data = await image.read()
    if not data or len(data) > MAX_BYTES:
        raise HTTPException(400, "send one image up to 10 MB")
    if not classifier.available():
        raise HTTPException(503, "model not installed (leaf_disease.onnx and leaf_gate.onnx): run scripts/fetch_vision_model.ps1")
    try:
        return classifier.classify(data)
    except OSError as e:
        raise HTTPException(400, "not a readable image") from e
