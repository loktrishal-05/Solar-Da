"""Build the cached weekly onion price series for Bangalore (Agmarknet, via the Mendeley onion 2014-2024 compilation,
CC BY 4.0, doi:10.17632/ds9jmxp9zy.1). Tamil Nadu has only 2 rows in that compilation, so Bangalore, the nearest
large South Indian market with a full history, is used.

Download the parquet into data/raw/agmarknet_onion/onion.parquet (see ATTRIBUTION.md), then:
  services/agents/.venv/Scripts/python -I data/market/build_prices.py
"""
from pathlib import Path

import pandas as pd

HERE = Path(__file__).resolve().parent
SRC = HERE.parents[0] / "raw" / "agmarknet_onion" / "onion.parquet"
MARKET = "Bangalore"


def main():
    d = pd.read_parquet(SRC, columns=["date", "market", "modal_price_rs_qtl", "arrivals_tonnes"])
    d = d[(d.market == MARKET) & (d.modal_price_rs_qtl > 0)]
    w = d.set_index("date").resample("W-MON", label="left", closed="left").agg(
        modal_price_rs_qtl=("modal_price_rs_qtl", "median"), reports=("modal_price_rs_qtl", "size"),
        arrivals_tonnes=("arrivals_tonnes", "sum"))
    # Data-quality label per week: gap (no report), sparse (< 3 reports), ok.
    w["quality"] = "ok"
    w.loc[w.reports < 3, "quality"] = "sparse"
    w.loc[w.reports == 0, "quality"] = "gap"
    w.index.name = "week_start"
    w.round(1).to_csv(HERE / "onion_bangalore_weekly.csv")
    print(len(w), w.quality.value_counts().to_dict())


if __name__ == "__main__":
    main()
