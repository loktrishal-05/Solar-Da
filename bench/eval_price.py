"""Rolling-origin evaluation of the price outlook vs seasonal naive and last value, 2019-2024, horizons 1 and 4 weeks.
Run: services/agents/.venv/Scripts/python -I bench/eval_price.py  ->  bench/results/price_outlook.json
"""
import json
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import market  # noqa: E402


def main():
    s = market.series()
    out = {"series": market.SOURCE, "metric": "MAPE % of actual weekly median modal price", "results": {}}
    for h in (1, 4):
        err = {"outlook": [], "seasonal_naive": [], "last_value": []}
        for asof in s.index[(s.index >= "2019-01-01")]:
            f = market.outlook_at(asof, h, s)
            if not f:
                continue
            actual = s.modal_price_rs_qtl.get(pd.Timestamp(f["target_week"]))
            if actual is None or pd.isna(actual) or f["seasonal_naive_rs_qtl"] is None:
                continue
            for k, v in (("outlook", f["outlook_rs_qtl"]), ("seasonal_naive", f["seasonal_naive_rs_qtl"]), ("last_value", f["last_rs_qtl"])):
                err[k].append(abs(v - actual) / actual * 100)
        res = {k: round(sum(v) / len(v), 1) for k, v in err.items()}
        res["n"] = len(err["outlook"])
        out["results"][f"{h}_week"] = res
        print(h, res)
    out["no_gain"] = [f"{h}: outlook MAPE {r['outlook']} >= last value {r['last_value']}"
                      for h, r in out["results"].items() if r["outlook"] >= r["last_value"]]
    (ROOT / "bench" / "results" / "price_outlook.json").write_text(json.dumps(out, indent=1))
    print(out["no_gain"])


if __name__ == "__main__":
    main()
