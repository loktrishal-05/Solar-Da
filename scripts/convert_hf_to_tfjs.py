"""
Download plant disease model from Hugging Face and convert to TensorFlow.js
for browser inference in the TerraSub & Solar-Da platform.

Model: linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification
- 38 PlantVillage classes
- 95.4% accuracy
- 224x224 input, MobileNetV2 backbone

Output: ../weiqou/web/public/models/plant-disease/
        - model.json
        - group1-shard1of1.bin (or similar weight shards)
        - class_names.json

Usage:
    pip install transformers torch tensorflow tensorflowjs onnx onnx-tf
    python scripts/convert_hf_to_tfjs.py
"""

import os
import json
import shutil
import subprocess
from pathlib import Path

from transformers import AutoModelForImageClassification, AutoImageProcessor

REPO_ID = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
WORK_DIR = Path(__file__).resolve().parent.parent / "tmp_model_convert"
OUTPUT_DIR = (
    Path(__file__).resolve().parent.parent
    / "weiqou"
    / "web"
    / "public"
    / "models"
    / "plant-disease"
)


def download_from_hf():
    print(f"[1/4] Downloading {REPO_ID} from Hugging Face...")
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    model = AutoModelForImageClassification.from_pretrained(
        REPO_ID, cache_dir=str(WORK_DIR)
    )
    processor = AutoImageProcessor.from_pretrained(
        REPO_ID, cache_dir=str(WORK_DIR)
    )
    print(f"     Classes: {len(model.config.id2label)}")
    return model, processor


def export_pytorch_to_onnx(model, processor):
    print("[2/4] Exporting PyTorch -> ONNX...")
    import torch

    onnx_path = WORK_DIR / "model.onnx"
    dummy = torch.randn(1, 3, 224, 224)
    torch.onnx.export(
        model,
        dummy,
        str(onnx_path),
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=13,
    )
    print(f"     Saved {onnx_path}")
    return onnx_path


def convert_onnx_to_savedmodel(onnx_path):
    print("[3/4] Converting ONNX -> TensorFlow SavedModel...")
    saved_model_dir = WORK_DIR / "saved_model"
    import onnx
    from onnx_tf.backend import prepare

    onnx_model = onnx.load(str(onnx_path))
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph(str(saved_model_dir))
    print(f"     Saved {saved_model_dir}")
    return saved_model_dir


def convert_savedmodel_to_tfjs(saved_model_dir):
    print("[4/4] Converting SavedModel -> TensorFlow.js (graph_model)...")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    cmd = [
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        "--signature_name=serving_default",
        "--saved_model_tags=serve",
        str(saved_model_dir),
        str(OUTPUT_DIR),
    ]
    print(f"     Running: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)
    print(f"     TF.js model written to {OUTPUT_DIR}")


def write_class_names(model):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    classes = {int(k): v for k, v in model.config.id2label.items()}
    out = OUTPUT_DIR / "class_names.json"
    with open(out, "w") as f:
        json.dump(classes, f, indent=2)
    print(f"     Wrote {out} ({len(classes)} classes)")


def write_metadata():
    meta = {
        "modelId": REPO_ID,
        "task": "image-classification",
        "architecture": "MobileNetV2",
        "inputShape": [1, 224, 224, 3],
        "inputName": "input",
        "outputName": "logits",
        "preprocess": {
            "resize": [224, 224],
            "normalize": "[-1, 1] (MobileNetV2 standard: (x/127.5) - 1)",
        },
        "numClasses": 38,
        "trainedOn": "PlantVillage",
        "version": "MobileNetV2-PlantVillage-HF-v1.0",
    }
    out = OUTPUT_DIR / "metadata.json"
    with open(out, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"     Wrote {out}")


def cleanup():
    if WORK_DIR.exists():
        shutil.rmtree(WORK_DIR)
        print(f"     Cleaned {WORK_DIR}")


def main():
    model, processor = download_from_hf()
    write_class_names(model)
    onnx_path = export_pytorch_to_onnx(model, processor)
    saved_model_dir = convert_onnx_to_savedmodel(onnx_path)
    convert_savedmodel_to_tfjs(saved_model_dir)
    write_metadata()
    cleanup()
    print("\nDONE. Place the model files in:")
    print(f"  {OUTPUT_DIR}")
    print("\nThen 'npm run dev' from the weiqou/web directory.")


if __name__ == "__main__":
    main()
