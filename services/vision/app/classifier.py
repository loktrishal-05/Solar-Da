"""Leaf-disease classifier: ONNX model trained in Colab (services/vision/train), temperature-calibrated,
with an abstain gate. It abstains, and asks for another photo, instead of guessing.

Model files live in services/vision/model/: leaf_disease.onnx (not in git; fetch with scripts/fetch_vision_model.ps1),
labels.json, calibration.json, metrics.json (committed).
"""
import io
import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps, ImageStat

MODEL_DIR = Path(__file__).resolve().parents[1] / "model"
IMG = 224
# Photo-quality gates, checked before the model runs. ponytail: fixed thresholds tuned on the repo's
# sample photos; recalibrate on field photos if they reject good images.
MIN_SHARPNESS = 60.0  # variance of the edge image (grayscale, 224 px, border trimmed)
MIN_BRIGHTNESS, MAX_BRIGHTNESS = 25, 235


@lru_cache(maxsize=1)
def _model():
    import onnxruntime as ort

    path = MODEL_DIR / "leaf_disease.onnx"
    if not path.exists():
        raise FileNotFoundError(f"{path} missing: run scripts/fetch_vision_model.ps1")
    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    labels = json.loads((MODEL_DIR / "labels.json").read_text())
    cal = json.loads((MODEL_DIR / "calibration.json").read_text())
    return sess, labels, cal


def available() -> bool:
    return (MODEL_DIR / "leaf_disease.onnx").exists()


def metrics() -> dict:
    p = MODEL_DIR / "metrics.json"
    return json.loads(p.read_text()) if p.exists() else {}


def photo_quality(img: Image.Image) -> tuple[bool, str, dict]:
    gray = ImageOps.grayscale(img.resize((IMG, IMG)))
    sharp = ImageStat.Stat(gray.filter(ImageFilter.FIND_EDGES).crop((4, 4, IMG - 4, IMG - 4))).var[0]
    bright = ImageStat.Stat(gray).mean[0]
    q = {"sharpness": round(sharp, 1), "brightness": round(bright, 1)}
    if sharp < MIN_SHARPNESS:
        return False, "Photo is too blurry. Hold the phone steady, 20-30 cm from one leaf, and retake.", q
    if bright < MIN_BRIGHTNESS:
        return False, "Photo is too dark. Retake in daylight.", q
    if bright > MAX_BRIGHTNESS:
        return False, "Photo is overexposed. Retake out of direct glare.", q
    return True, "", q


def softmax(z: np.ndarray) -> np.ndarray:
    z = z - z.max(-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(-1, keepdims=True)


def classify(image_bytes: bytes, top_k: int = 3) -> dict:
    img = ImageOps.exif_transpose(Image.open(io.BytesIO(image_bytes))).convert("RGB")
    ok, why, q = photo_quality(img)
    if not ok:
        return {"abstain": True, "reason": why, "quality": q, "predictions": []}
    sess, labels, cal = _model()
    # Same preprocessing as training (tf.image.resize of the whole image, bilinear, no crop/normalisation).
    x = np.asarray(img.resize((IMG, IMG), Image.BILINEAR), dtype=np.float32)[None]
    logits = sess.run(None, {"image": x})[0][0]
    p = softmax(logits / cal["temperature"])
    order = np.argsort(-p)[:top_k]
    preds = [{"label": labels[i], "crop": labels[i].split("___")[0].replace("_", " "),
              "condition": labels[i].split("___")[-1].replace("_", " ").strip(),
              "healthy": labels[i].endswith("healthy"), "confidence": round(float(p[i]), 4)} for i in order]
    top = preds[0]
    if top["confidence"] < cal["abstain_threshold"]:
        return {"abstain": True, "quality": q, "predictions": preds,
                "reason": f"Not confident enough ({top['confidence']:.0%} < {cal['abstain_threshold']:.0%}). "
                          "Retake a close, sharp photo of one affected leaf."}
    return {"abstain": False, "quality": q, "predictions": preds, "top": top,
            "threshold": cal["abstain_threshold"], "calibrated": True}
