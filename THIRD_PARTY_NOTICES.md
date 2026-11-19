# Third-party data, models and assets

The Solarda **code** is MIT licensed (`LICENSE`). The data, model weights and media below keep their own licences.
Large datasets and model weights are not in git: they are fetched from their sources or from this repository's GitHub releases.

## Datasets
| Asset | Where it is used | Source | Licence |
|---|---|---|---|
| EDEN ISS 2020 greenhouse telemetry | replayed sensor feeds (`data/replay/slices/eden_iss_*.csv`) | Zenodo record 11485183 | CC BY 4.0 |
| HydroGrowNet sensor workbooks | replayed nutrient-water feeds (`data/replay/slices/hydrogrownet_water.csv`) | Mendeley Data `g6cm3v3wdp` | CC BY 4.0 |
| Open-Meteo historical and forecast weather | crop twin weather, assistant weather (`data/weather/`) | open-meteo.com | CC BY 4.0 (free tier: non-commercial) |
| Onion market data 2014-2024 (Agmarknet prices) | price outlook (`data/market/`) | Mendeley Data, doi:10.17632/ds9jmxp9zy.1; original prices: Agmarknet, Government of India | CC BY 4.0 |
| PlantVillage leaf images | vision training; demo and sample leaves (`data/demo_images/`, `weiqou/web/public/media/plant-samples/`) | Hughes & Salathé 2015, spMohanty/PlantVillage-Dataset | CC BY-SA 3.0 |
| PlantDoc | vision training (train split) and field evaluation (test split) | Singh et al. 2020, pratikkayal/PlantDoc-Dataset | CC BY 4.0 |
| PlantWild | evaluation only, not redistributed and not used for training | PlantWild authors | CC BY-NC-ND |
| Wikipedia agronomy articles | approved sources for the assistant (`data/knowledge/wiki_*.md`, each with its revision) | Wikipedia contributors | CC BY-SA 4.0 |

Each folder under `data/` has an `ATTRIBUTION.md` (or per-file front matter) with the exact source and any changes.

## Model weights (GitHub release assets)
| Weights | Trained on | Notes |
|---|---|---|
| `vision-v1` leaf-disease classifier (EfficientNetV2-B0, ONNX) | PlantVillage + PlantDoc train split | Derived from CC BY-SA 3.0 and CC BY 4.0 data; distributed with this attribution. |
| `sensor-models-v2-onnx` forecasters and anomaly detector | EDEN ISS 2020 | Derived from CC BY 4.0 data. |

## Software and fonts
- Crop simulation: AquaCrop-OSPy (MIT). Web: React, three.js, Recharts (MIT), lucide icons (ISC). API: Express (MIT), zod (MIT).
  Agents: FastAPI, LangGraph, LangChain (MIT), ONNX Runtime (MIT). Full dependency licences are in each package's metadata.
- Fonts (loaded from Google Fonts): Bricolage Grotesque, IBM Plex Sans, Noto Sans Tamil, JetBrains Mono, all SIL Open Font License 1.1.

## Media
- `weiqou/web/public/media/hero-soil.mp4` and `hero-soil.jpg`: illustrative footage supplied by the team, trimmed and looped for
  the landing page, and labelled "Illustrative footage" on screen.
