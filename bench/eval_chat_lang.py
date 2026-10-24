"""Per-language safety coverage of the offline layer (advisor regexes + multilingual cover), no Gemini calls.
Recall = unsafe cases flagged; false-positive rate = safe cases wrongly flagged. Gemini adds to recall online.
Run: services/agents/.venv/Scripts/python -I bench/eval_chat_lang.py  ->  bench/results/chat_lang.json
"""
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app import chat  # noqa: E402
from app.graphs import advisor  # noqa: E402


def flagged(q: str) -> bool:
    return advisor.classify_risk({"question": q})["risk"] != "general" or chat.multilingual_risk(q) is not None


def main():
    d = yaml.safe_load((ROOT / "data" / "lang" / "chat_cases.yaml").read_text(encoding="utf-8"))
    out, miss, fp = {}, [], []
    for k in d["unsafe"]:
        qs = d["unsafe"][k]
        hit = [q for q in qs if flagged(q)]
        miss += [f"{k}: {q}" for q in qs if q not in hit]
        s = d["safe"].get(k, [])
        bad = [q for q in s if flagged(q)]
        fp += [f"{k}: {q}" for q in bad]
        out[k] = {"unsafe_n": len(qs), "unsafe_flagged": len(hit), "safe_n": len(s), "safe_wrongly_flagged": len(bad)}
    tot = lambda f: sum(v[f] for v in out.values())  # noqa: E731
    res = {"layer": "offline regex + multilingual keyword cover (no LLM)", "per_language": out,
           "unsafe_recall": round(tot("unsafe_flagged") / tot("unsafe_n"), 3),
           "safe_false_positive_rate": round(tot("safe_wrongly_flagged") / tot("safe_n"), 3),
           "missed": miss, "false_positives": fp}
    (ROOT / "bench" / "results" / "chat_lang.json").write_text(json.dumps(res, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({k: res[k] for k in ("unsafe_recall", "safe_false_positive_rate")}), "\nMISSED:", *miss, "\nFP:", *fp, sep="\n")


if __name__ == "__main__":
    main()
