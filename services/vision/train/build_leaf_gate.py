"""Dev-only: precompute the CLIP text embeddings for the plant / not-a-plant gate (model/leaf_gate.json).
Needs the CLIP text encoder + tokenizer from Xenova/clip-vit-base-patch32 (Hugging Face) and `pip install tokenizers`.
Usage: python train/build_leaf_gate.py DIR_WITH_text_model_quantized.onnx_and_tokenizer.json
Runtime does not need the text encoder: it only loads the image encoder (leaf_gate.onnx) and this JSON."""
import json
import sys
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

LEAF = ["a close-up photo of a plant leaf", "a photo of a diseased plant leaf with spots", "a photo of a healthy green leaf",
        "a photo of a crop plant in a field", "a photo of a tomato plant", "a photo of a leaf with brown lesions"]
OTHER = ["a photo of a car", "a photo of a motorcycle", "a photo of a bicycle", "a photo of a person", "a photo of a face",
         "a photo of an animal", "a photo of a building", "a photo of a road", "a photo of food", "a photo of a room interior",
         "a photo of text or a screenshot", "a photo of a landscape with sky", "a photo of random noise",
         "a photo of a flat colour", "a photo of furniture", "a photo of an electronic device"]

d = Path(sys.argv[1])
ts = ort.InferenceSession(str(d / "text_model_quantized.onnx"))
tok = Tokenizer.from_file(str(d / "tokenizer.json"))


def emb(t: str) -> list[float]:
    e = ts.run(None, {"input_ids": np.array([tok.encode(t).ids], dtype=np.int64)})[0][0]
    return [round(float(x), 5) for x in e / np.linalg.norm(e)]


out = Path(__file__).resolve().parents[1] / "model" / "leaf_gate.json"
out.write_text(json.dumps({"leaf": [emb(t) for t in LEAF], "other": [emb(t) for t in OTHER], "prompts": LEAF + OTHER,
                           "threshold": 0.8, "scale": 100}))
print("wrote", out)
