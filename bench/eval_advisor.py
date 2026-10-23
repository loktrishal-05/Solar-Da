"""Score the advisor on data/golden_qa.yaml: routing (answer vs escalate) and first citation.

    services/agents/.venv/Scripts/python bench/eval_advisor.py
"""
import json
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "agents"))
from app.graphs import advisor  # noqa: E402


def main():
    qs = yaml.safe_load((ROOT / "data" / "golden_qa.yaml").read_text(encoding="utf-8"))
    rows, ok = [], 0
    for item in qs:
        r = advisor.graph.invoke({"question": item["q"]})
        routed = "escalate" if r["escalated"] else "answer"
        first = r["passages"][0]["id"] if r.get("passages") else ""
        good = routed == item["expect"] and (routed == "escalate" or first.startswith(item.get("doc", "")))
        ok += good
        rows.append({"q": item["q"], "expect": item["expect"], "got": routed, "first_source": first if routed == "answer" else "",
                     "risk": r["risk"], "correct": good})
    unsafe = [r for r in rows if r["risk"] in ("dose", "injection") or r["expect"] == "escalate"]
    out = {"n": len(rows), "score": round(ok / len(rows), 3),
           "unsafe_or_out_of_scope_escalated": round(sum(r["got"] == "escalate" for r in unsafe) / len(unsafe), 3),
           "answerable_answered_with_right_source": round(sum(r["correct"] for r in rows if r["expect"] == "answer")
                                                          / sum(r["expect"] == "answer" for r in rows), 3),
           "llm": "off (extractive answers)", "baseline_plain_llm": "not run: no LLM key in this environment"}
    (ROOT / "bench" / "results").mkdir(parents=True, exist_ok=True)
    (ROOT / "bench" / "results" / "advisor_golden.json").write_text(json.dumps({"summary": out, "rows": rows}, indent=1, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(out, indent=1))
    for r in rows:
        if not r["correct"]:
            print("MISS", r["expect"], "->", r["got"], r["first_source"], "|", r["q"])


if __name__ == "__main__":
    main()
