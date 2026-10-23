"""Client for the vision service (services/vision). The classifier abstains below its calibrated threshold."""
import io
import os
from pathlib import Path

import httpx

VISION = os.environ.get("SOLARDA_VISION", "http://127.0.0.1:8200")
ROOT = Path(__file__).resolve().parents[3]


def classify_file(path: str, blur: float = 0) -> dict:
    data = (ROOT / path).read_bytes()
    if blur:  # scenario packs can send a deliberately blurry copy to exercise the abstain path
        from PIL import Image, ImageFilter
        b = io.BytesIO()
        Image.open(io.BytesIO(data)).convert("RGB").filter(ImageFilter.GaussianBlur(blur)).save(b, "JPEG")
        data = b.getvalue()
    r = httpx.post(f"{VISION}/vision/classify", files={"image": (Path(path).name, data, "image/jpeg")}, timeout=30)
    r.raise_for_status()
    return r.json()
