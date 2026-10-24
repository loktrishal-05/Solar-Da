"""Twin service: POST /twin/run (one option) and POST /twin/options (the irrigation agent's three options)."""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from . import twin

app = FastAPI(title="Solarda twin (AquaCrop-OSPy)")


class Irrigation(BaseModel):
    date: str
    mm: float


class RunRequest(BaseModel):
    planting: str
    until: str
    irrigation: list[Irrigation] = []
    crop: str = "Tomato"
    soil: str = "SandyLoam"
    horizon_from: str | None = None


class OptionsRequest(BaseModel):
    planting: str
    today: str
    history: list[Irrigation] = []
    depth_mm: float = 20
    horizon_days: int = 7
    crop: str = "Tomato"
    soil: str = "SandyLoam"


@app.get("/health")
def health():
    return {"status": "ok", "service": "twin", "model": "AquaCrop-OSPy 3.1.0", "weather": "Chennai 2021-2023 (Open-Meteo)"}


@app.post("/twin/run")
def run(req: RunRequest):
    try:
        return twin.run(req.planting, req.until, [i.model_dump() for i in req.irrigation], req.crop, req.soil, req.horizon_from)
    except (ValueError, KeyError, IndexError) as e:
        raise HTTPException(400, f"twin run failed: {e}")


class HarvestRequest(BaseModel):
    planting: str
    today: str
    crop: str = "Tomato"
    soil: str = "SandyLoam"


@app.post("/twin/harvest")
def harvest(req: HarvestRequest):
    try:
        return twin.forecast_harvest(req.planting, req.today, req.crop, req.soil)
    except (ValueError, KeyError, IndexError) as e:
        raise HTTPException(400, f"twin run failed: {e}")


@app.post("/twin/options")
def options(req: OptionsRequest):
    try:
        return twin.compare_options(req.planting, req.today, [i.model_dump() for i in req.history], req.depth_mm,
                                    req.horizon_days, req.crop, req.soil)
    except (ValueError, KeyError, IndexError) as e:
        raise HTTPException(400, f"twin run failed: {e}")
