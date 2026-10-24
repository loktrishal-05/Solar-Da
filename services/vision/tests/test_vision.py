import io
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageFilter

from app import classifier
from app.main import app

ROOT = Path(__file__).resolve().parents[3]
client = TestClient(app)
needs_model = pytest.mark.skipif(not classifier.available(), reason="model not fetched (scripts/fetch_vision_model.ps1)")


def _jpeg(img: Image.Image) -> bytes:
    b = io.BytesIO()
    img.save(b, "JPEG")
    return b.getvalue()


def test_blurry_photo_abstains_before_the_model():
    sharp = Image.open(next((ROOT / "sample images").glob("*.jpeg"))).convert("RGB")
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
    assert any("Tomato" in l for l in labels), body


@needs_model
def test_out_of_distribution_palm_photos_mostly_abstain():
    # The repo's sample photos are palm fronds: not one of the 38 classes. The gate should refuse most of them.
    res = [client.post("/vision/classify", files={"image": (p.name, p.read_bytes(), "image/jpeg")}).json()
           for p in sorted((ROOT / "sample images").glob("*.jpeg"))]
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
