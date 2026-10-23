"""Fetch the public datasets and write the small committed slices the replay layer reads.

    python -m app.replay.build_slices          (from services/agents)

Full files land in data/replay/full/ (gitignored); slices in data/replay/slices/ (committed).
Slice format (long CSV): ts,zone,metric,value,unit  - ts in ISO UTC, dataset time.
"""
import io
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
FULL = ROOT / "data" / "replay" / "full"
SLICES = ROOT / "data" / "replay" / "slices"

EDEN_URL = "https://zenodo.org/api/records/11485183/files/edeniss2020.zip/content"  # CC BY 4.0
HGN_URL = ("https://data.mendeley.com/public-files/datasets/g6cm3v3wdp/files/"
           "cc1efb51-64d2-4115-94ff-d3cc5442f798/file_downloaded")  # CC BY 4.0, sensor workbooks only

# EDEN ISS file -> (zone, metric, unit, scale). VPD is published in mbar; we use kPa.
EDEN_SENSORS = {
    "ams-feg/temp-1.csv": ("feg", "air_temp", "C", 1),
    "ams-feg/temp-2.csv": ("feg", "air_temp_b", "C", 1),
    "ams-feg/rh-1.csv": ("feg", "rh", "%", 1),
    "ams-feg/co2-1.csv": ("feg", "co2", "ppm", 1),
    "ams-feg/par-1.csv": ("feg", "par", "umol/m2/s", 1),
    "ams-ses/vpd-1.csv": ("feg", "vpd", "kPa", 0.1),
    "nds/ph-tank1_1.csv": ("tank1", "ph", "pH", 1),
    "nds/ph-tank1_2.csv": ("tank1", "ph_b", "pH", 1),
    "nds/ec-tank1_1.csv": ("tank1", "ec", "mS/cm", 1),
    "nds/ec-tank1_2.csv": ("tank1", "ec_b", "mS/cm", 1),
    "nds/temp-tank1_1.csv": ("tank1", "solution_temp", "C", 1),
    "nds/level-tank1.csv": ("tank1", "level", "cm", 1),
}
EDEN_WINDOW = ("2020-03-01", "2020-03-15")  # 14 days


def _fetch_zip(url: str, dest: Path):
    if dest.exists() and any(dest.iterdir()):
        return
    dest.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url) as r:
        zipfile.ZipFile(io.BytesIO(r.read())).extractall(dest)


def eden_slice() -> pd.DataFrame:
    src = FULL / "eden"
    _fetch_zip(EDEN_URL, src)
    base = next(src.rglob("edeniss2020.csv")).parent
    frames = []
    for f, (zone, metric, unit, scale) in EDEN_SENSORS.items():
        d = pd.read_csv(base / f, parse_dates=["time"])
        d = d[(d.time >= EDEN_WINDOW[0]) & (d.time < EDEN_WINDOW[1])]
        v = d.iloc[:, 1]
        # -9.99 is the dataset's missing-value sentinel: keep it, the quality checks must catch it.
        v = v.where(v == -9.99, v * scale)
        frames.append(pd.DataFrame({"ts": d.time.dt.strftime("%Y-%m-%dT%H:%M:%SZ"), "zone": zone,
                                    "metric": metric, "value": v.round(4), "unit": unit}))
    return pd.concat(frames).sort_values(["ts", "zone", "metric"])


def _hgn_day(cell):
    """Workbook dates are d/m/Y text ('/' or '\'), or Excel datetimes whose day and month were swapped."""
    if isinstance(cell, datetime):
        return cell.replace(month=cell.day, day=cell.month)
    if isinstance(cell, str):
        try:
            return datetime.strptime(cell.strip().replace("\\", "/"), "%d/%m/%Y")
        except ValueError:
            return None
    return None


def hgn_slice() -> pd.DataFrame:
    """HydroGrowNet: portable water-quality readings at 10:00 and 14:00 per replicate channel."""
    src = FULL / "hgn"
    _fetch_zip(HGN_URL, src)
    rows = []
    for xlsx in sorted(src.glob("EXP.*.xlsx")):
        exp = xlsx.name.split(".")[1]
        d = pd.read_excel(xlsx, sheet_name=2, header=None)
        for block_col, hour in ((1, "10:00:00"), (29, "14:00:00")):
            for rep in range(6):
                c = block_col + rep * 4
                label = str(d.iat[1, c]).strip().lower().replace("replicate ", "r").replace(" ", "-")
                for i in range(3, len(d)):
                    day = _hgn_day(d.iat[i, 0])
                    if day is None:
                        continue
                    ts = f"{day:%Y-%m-%d}T{hour}Z"
                    for off, metric, unit in ((0, "ph", "pH"), (1, "ec", "mS/cm"), (3, "solution_temp", "C")):
                        val = pd.to_numeric(d.iat[i, c + off], errors="coerce")
                        if pd.notna(val):
                            rows.append((ts, f"exp{exp}-{label}", metric, float(val), unit))
    return pd.DataFrame(rows, columns=["ts", "zone", "metric", "value", "unit"]).sort_values(["ts", "zone", "metric"])


def main():
    SLICES.mkdir(parents=True, exist_ok=True)
    e = eden_slice()
    e.to_csv(SLICES / "eden_iss_2020-03-01_14d.csv", index=False)
    h = hgn_slice()
    h.to_csv(SLICES / "hydrogrownet_water.csv", index=False)
    print(f"eden {len(e)} rows, hydrogrownet {len(h)} rows -> {SLICES}")


if __name__ == "__main__":
    main()
