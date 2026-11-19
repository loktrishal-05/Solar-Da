import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageFilter

from app import classifier
from app.main import app

ROOT = Path(__file__).resolve().parents[3]
# Palm-frond photos: real field photos that are not one of the 38 crop classes.
PALMS = sorted((Path(__file__).parent / "fixtures").glob("palm_frond_*.jpeg"))
client = TestClient(app)
needs_model = pytest.mark.skipif(not classifier.available(), reason="model not fetched (scripts/fetch_vision_model.ps1)")


def _jpeg(img: Image.Image) -> bytes:
    b = io.BytesIO()
    img.save(b, "JPEG")
    return b.getvalue()


def test_blurry_photo_abstains_before_the_model():
    sharp = Image.open(PALMS[0]).convert("RGB")
    blurry = sharp.filter(ImageFilter.GaussianBlur(12))
    ok, reason, _ = classifier.photo_quality(blurry)
    assert not ok and "blurry" in reason
    assert classifier.photo_quality(sharp)[0]


def test_dark_photo_abstains():
    assert not classifier.photo_quality(Image.new("RGB", (300, 300), (5, 5, 5)))[0]


def test_rejects_non_image():
    r = client.post("/vision/classify", files={"image": ("x.jpg", b"not an image", "image/jpeg")})
    assert r.status_code in (400, 503)


@needs_model
def test_known_diseased_leaf_is_classified():
    r = client.post("/vision/classify", files={"image": ("leaf.jpg", (ROOT / "data/demo_images/tomato_late_blight_plantvillage.jpg").read_bytes(), "image/jpeg")})
    body = r.json()
    assert r.status_code == 200
    labels = [p["label"] for p in body["predictions"]]
    assert any("Tomato" in label for label in labels), body


@needs_model
def test_out_of_distribution_palm_photos_mostly_abstain():
    # Palm fronds are not one of the 38 classes. The gate should refuse most of them.
    res = [client.post("/vision/classify", files={"image": (p.name, p.read_bytes(), "image/jpeg")}).json()
           for p in PALMS]
    assert sum(r["abstain"] for r in res) >= len(res) // 2 + 1, [r.get("top") for r in res]


def test_leaf_crop_trims_background_and_leaves_full_frame_leaves_alone():
    from PIL import Image

    from app.classifier import leaf_crop
    bg = Image.new("RGB", (400, 400), (240, 240, 240))
    bg.paste(Image.new("RGB", (120, 160), (60, 140, 40)), (200, 150))
    c = leaf_crop(bg)
    assert c.size[0] < 250 and c.size[1] < 250
    full = Image.new("RGB", (300, 300), (60, 140, 40))
    assert leaf_crop(full).size == (300, 300)


def test_no_cross_origin_access():
    r = client.get("/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in r.headers


def _scene(kind: str) -> bytes:
    """Synthetic non-plant photos (textured so they pass the blur/brightness gates)."""
    import numpy as np
    from PIL import ImageDraw

    rng = np.random.default_rng(1)
    if kind == "noise":
        return _jpeg(Image.fromarray(rng.integers(0, 255, (480, 640, 3), dtype="uint8")))
    im = Image.new("RGB", (640, 480), (135, 190, 235))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 330, 640, 480], fill=(70, 70, 75))
    d.rectangle([90, 240, 550, 360], fill=(190, 20, 25))
    d.polygon([(190, 240), (260, 170), (420, 170), (470, 240)], fill=(180, 15, 20))
    for x in (170, 470):
        d.ellipse([x - 45, 320, x + 45, 410], fill=(20, 20, 20))
    a = np.asarray(im).astype(int) + rng.integers(-25, 25, (480, 640, 3))
    return _jpeg(Image.fromarray(np.clip(a, 0, 255).astype("uint8")))


@needs_model
@pytest.mark.parametrize("kind", ["car", "noise"])
def test_non_plant_photo_is_refused_without_naming_a_disease(kind):
    r = client.post("/vision/classify", files={"image": ("x.jpg", _scene(kind), "image/jpeg")})
    body = r.json()
    assert r.status_code == 200 and body["abstain"] and body["not_a_leaf"], body
    assert body["predictions"] == [] and "not look like a plant" in body["reason"]


@needs_model
def test_demo_leaves_pass_the_plant_gate_and_get_a_diagnosis():
    for f in sorted((ROOT / "data/demo_images").glob("*.jpg")):
        body = client.post("/vision/classify", files={"image": (f.name, f.read_bytes(), "image/jpeg")}).json()
        assert not body.get("not_a_leaf") and body["predictions"], (f.name, body)
        assert body["plant_score"] >= 0.8
