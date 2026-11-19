"""Plant / not-a-plant gate: zero-shot CLIP (image encoder as ONNX + precomputed text embeddings in model/leaf_gate.json).
The disease model knows only 38 crop-disease classes, so on a car photo it would still name a disease. This gate runs first
and refuses anything that is not a plant. Measured: leaves >= 0.98, cars/bikes/people/rooms/noise <= 0.39 (threshold 0.8).
Weights (leaf_gate.onnx, 89 MB, Xenova/clip-vit-base-patch32) are fetched, not committed."""
import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image

MODEL_DIR = Path(__file__).resolve().parents[1] / "model"
_MEAN = np.array([0.48145466, 0.4578275, 0.40821073], dtype=np.float32)
_STD = np.array([0.26862954, 0.26130258, 0.27577711], dtype=np.float32)


def available() -> bool:
    return (MODEL_DIR / "leaf_gate.onnx").exists() and (MODEL_DIR / "leaf_gate.json").exists()


@lru_cache(maxsize=1)
def _load():
    import onnxruntime as ort

    o = ort.SessionOptions()
    o.intra_op_num_threads = 1
    cfg = json.loads((MODEL_DIR / "leaf_gate.json").read_text())
    sess = ort.InferenceSession(str(MODEL_DIR / "leaf_gate.onnx"), o, providers=["CPUExecutionProvider"])
    return sess, np.array(cfg["leaf"] + cfg["other"], dtype=np.float32), len(cfg["leaf"]), cfg["threshold"], cfg["scale"]


def plant_score(img: Image.Image) -> tuple[float, float]:
    """Return (probability the photo is a plant, threshold)."""
    sess, text, n_leaf, threshold, scale = _load()
    w, h = img.size
    s = 224 / min(w, h)
    img = img.resize((max(224, round(w * s)), max(224, round(h * s))), Image.BICUBIC)
    w, h = img.size
    left, top = (w - 224) // 2, (h - 224) // 2
    x = (np.asarray(img.crop((left, top, left + 224, top + 224)), dtype=np.float32) / 255 - _MEAN) / _STD
    e = sess.run(None, {"pixel_values": x.transpose(2, 0, 1)[None]})[0][0]
    z = scale * text @ (e / np.linalg.norm(e))
    p = np.exp(z - z.max())
    return float((p / p.sum())[:n_leaf].sum()), threshold
