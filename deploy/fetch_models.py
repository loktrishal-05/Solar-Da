"""Download model weights from the GitHub releases unless already present (local builds copy them in).
A missing release only warns: the services report the model as not installed instead of failing the build."""
import io
import pathlib
import urllib.request
import zipfile

BASE = "https://github.com/loktrishal-05/Solar-Da/releases/download/"
for url, dest, marker in [
    (BASE + "vision-v1/solarda_vision.zip", "services/vision/model", "leaf_disease.onnx"),
    (BASE + "sensor-models-v2-onnx/solarda_sensor_models_onnx.zip", "services/agents/model", "onnx/meta.json"),
]:
    if (pathlib.Path(dest) / marker).exists():
        continue
    try:
        zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(url).read())).extractall(dest)
    except Exception as e:  # noqa: BLE001
        print(f"WARNING: could not fetch {url}: {e}")
