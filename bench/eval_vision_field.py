"""Field evaluation of the vision-v1 leaf-disease model on PlantDoc (test split) and PlantWild (v1 test split),
with and without the leaf crop. Images are downloaded to data/raw/ (gitignored, never redistributed:
PlantWild is CC BY-NC-ND 4.0, used here for evaluation only).

Run: services/vision/.venv/Scripts/python -I bench/eval_vision_field.py
Writes bench/results/vision_field.json
"""
import io
import json
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request, urlopen

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "vision"))
from app import classifier as C  # noqa: E402

RAW = ROOT / "data" / "raw"
HF = "https://huggingface.co/datasets/Voxel51/PlantWild/resolve/main/"
LABELS = json.loads((C.MODEL_DIR / "labels.json").read_text())

# Field class name -> keywords that must all appear in exactly one PlantVillage label (same rule as the notebook).
KEYS = {
    "apple black rot": ("apple", "black_rot"), "apple leaf": ("apple", "healthy"), "apple rust": ("apple", "rust"),
    "apple scab": ("apple", "scab"), "apple scab leaf": ("apple", "scab"), "apple rust leaf": ("apple", "rust"),
    "bell pepper leaf": ("pepper", "healthy"), "bell pepper leaf spot": ("pepper", "bacterial"),
    "bell_pepper leaf": ("pepper", "healthy"), "bell_pepper leaf spot": ("pepper", "bacterial"),
    "blueberry leaf": ("blueberry", "healthy"), "cherry leaf": ("cherry", "healthy"),
    "cherry powdery mildew": ("cherry", "powdery"), "citrus greening disease": ("orange", "haunglongbing"),
    "corn gray leaf spot": ("corn", "gray"), "corn leaf": ("corn", "healthy"),
    "corn northern leaf blight": ("corn", "northern"), "corn leaf blight": ("corn", "northern"),
    "corn rust": ("corn", "rust"), "corn rust leaf": ("corn", "rust"),
    "grape black rot": ("grape", "black_rot"), "grape leaf black rot": ("grape", "black_rot"),
    "grape leaf": ("grape", "healthy"), "grape leaf spot": ("grape", "isariopsis"),
    "peach leaf": ("peach", "healthy"), "potato early blight": ("potato", "early"),
    "potato leaf early blight": ("potato", "early"), "potato late blight": ("potato", "late"),
    "potato leaf late blight": ("potato", "late"), "potato leaf": ("potato", "healthy"),
    "raspberry leaf": ("raspberry", "healthy"), "soybean leaf": ("soybean", "healthy"),
    "soyabean leaf": ("soybean", "healthy"), "squash powdery mildew": ("squash", "powdery"),
    "squash powdery mildew leaf": ("squash", "powdery"), "strawberry leaf": ("strawberry", "healthy"),
    "strawberry leaf scorch": ("strawberry", "scorch"),
    "tomato bacterial leaf spot": ("tomato", "bacterial"), "tomato leaf bacterial spot": ("tomato", "bacterial"),
    "tomato early blight": ("tomato", "early"), "tomato early blight leaf": ("tomato", "early"),
    "tomato late blight": ("tomato", "late"), "tomato leaf late blight": ("tomato", "late"),
    "tomato leaf": ("tomato", "healthy"), "tomato leaf mold": ("tomato", "mold"), "tomato mold leaf": ("tomato", "mold"),
    "tomato mosaic virus": ("tomato", "mosaic"), "tomato leaf mosaic virus": ("tomato", "mosaic"),
    "tomato septoria leaf spot": ("tomato", "septoria"),
    "tomato yellow leaf curl virus": ("tomato", "yellow"), "tomato leaf yellow virus": ("tomato", "yellow"),
    "tomato two spotted spider mites leaf": ("tomato", "spider"),
}


def label_index(name: str):
    keys = KEYS.get(name.lower().strip())
    if not keys:
        return None
    hits = [i for i, c in enumerate(LABELS) if all(k in c.lower() for k in keys)]
    return hits[0] if len(hits) == 1 else None


def fetch(url: str, dest: Path) -> Path | None:
    if dest.exists():
        return dest
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(urlopen(Request(url, headers={"User-Agent": "solarda-eval"}), timeout=60).read())
        return dest
    except Exception:
        return None


def plantwild() -> list[tuple[Path, int]]:
    idx = RAW / "plantwild" / "samples.json"
    fetch(HF + "samples.json", idx)
    samples = json.loads(idx.read_text(encoding="utf-8"))["samples"]
    todo = [(s["filepath"], label_index(s["ground_truth"]["label"])) for s in samples
            if s.get("dataset_version") == "v1" and s.get("split") == "test"]
    todo = [(fp, y) for fp, y in todo if y is not None]
    with ThreadPoolExecutor(16) as ex:
        paths = list(ex.map(lambda t: fetch(HF + t[0], RAW / "plantwild" / t[0]), todo))
    return [(p, y) for p, (_, y) in zip(paths, todo) if p]


def plantdoc() -> list[tuple[Path, int]]:
    repo = RAW / "PlantDoc-Dataset"
    if not repo.exists():
        subprocess.run(["git", "clone", "-q", "--depth", "1", "--filter=blob:none", "--sparse",
                        "https://github.com/pratikkayal/PlantDoc-Dataset", str(repo)], check=True)
        subprocess.run(["git", "-C", str(repo), "sparse-checkout", "set", "test"], check=True)
    out = []
    for d in sorted((repo / "test").iterdir()):
        y = label_index(d.name) if d.is_dir() else None
        if y is not None:
            out += [(f, y) for f in d.iterdir() if f.suffix.lower() in {".jpg", ".jpeg", ".png"}]
    return out


def run(items, crop: bool) -> dict:
    sess, _, cal = C._model()
    T, thr = cal["temperature"], cal["abstain_threshold"]
    correct = answered = answered_ok = quality_rejects = n = 0
    for path, y in items:
        try:
            img = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
        except Exception:
            continue
        n += 1
        ok, _, _ = C.photo_quality(img)
        if crop:
            img = C.leaf_crop(img)
        x = np.asarray(img.resize((C.IMG, C.IMG), Image.BILINEAR), dtype=np.float32)[None]
        p = C.softmax(sess.run(None, {"image": x})[0][0] / T)
        hit = int(p.argmax()) == y
        correct += hit
        if not ok:
            quality_rejects += 1
        elif p.max() >= thr:
            answered += 1
            answered_ok += hit
    return {"n": n, "top1_accuracy": round(correct / n, 4), "abstain_rate": round(1 - answered / n, 4),
            "photo_quality_rejects": quality_rejects,
            "accuracy_when_answered": round(answered_ok / answered, 4) if answered else None}


def main():
    sets = {"plantdoc_test": plantdoc(), "plantwild_v1_test": plantwild()}
    out = {"model": "vision-v1 (EfficientNetV2-B0)", "threshold": C._model()[2]["abstain_threshold"],
           "note": "Mapped classes only (field class -> one of the 38 PlantVillage labels). Top-1 accuracy ignores "
                   "the abstain gate; abstain_rate includes photo-quality rejects. PlantWild CC BY-NC-ND 4.0, "
                   "evaluation only, images not redistributed."}
    for name, items in sets.items():
        out[name] = {"no_crop": run(items, False), "leaf_crop": run(items, True)}
        print(name, json.dumps(out[name]))
    (ROOT / "bench" / "results" / "vision_field.json").write_text(json.dumps(out, indent=1))


if __name__ == "__main__":
    main()
