"""Retrieval over approved agronomy text in data/knowledge/ (each file states its source and licence).

Offline BM25 over paragraphs. ponytail: lexical search, no embeddings; swap in init_embeddings + Chroma
when an embedding model can run offline on the demo laptop.
"""
import math
import re
from collections import Counter
from functools import lru_cache
from pathlib import Path

KB = Path(__file__).resolve().parents[3] / "data" / "knowledge"
_TOKEN = re.compile(r"[a-z0-9]+")


def _tok(s: str) -> list[str]:
    return _TOKEN.findall(s.lower())


@lru_cache(maxsize=1)
def _index():
    chunks = []
    for f in sorted(KB.glob("*.md")):
        head, body = f.read_text(encoding="utf-8").split("---\n", 2)[1:]
        meta = dict(line.split(": ", 1) for line in head.strip().splitlines())
        for i, para in enumerate(p.strip() for p in re.split(r"\n\s*\n|\n(?==)", body) if len(p.strip()) > 80):
            chunks.append({"id": f"{meta['id']}#{i}", "doc": meta["id"], "title": meta["title"], "source": meta["source"],
                           "licence": meta["licence"], "text": para, "aliases": meta.get("aliases", ""),
                           "tokens": _tok(" ".join([meta["title"], meta.get("aliases", "")] * 2) + " " + para)})
    df = Counter(t for c in chunks for t in set(c["tokens"]))
    avg = sum(len(c["tokens"]) for c in chunks) / max(1, len(chunks))
    return chunks, df, avg


STOP = set("a an the of on in at to for and or is are was be my our your i we you it this that what which how why when "
           "where who do does did can could should would will with from by about any some there have has had me "
           "please tell plants plant crop crops".split())


def coverage(query: str, passage: dict) -> float:
    """Share of the question's content words that the passage (or its title/aliases) contains."""
    q = {t for t in _tok(query) if t not in STOP and len(t) > 2}
    have = set(_tok(" ".join([passage["title"], passage.get("aliases", ""), passage["text"]])))
    return len(q & have) / len(q) if q else 0.0


def search(query: str, k: int = 3, k1: float = 1.5, b: float = 0.75) -> list[dict]:
    chunks, df, avg = _index()
    q = _tok(query)
    n = len(chunks)
    scored = []
    for c in chunks:
        tf = Counter(c["tokens"])
        s = sum(math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5)) * tf[t] * (k1 + 1)
                / (tf[t] + k1 * (1 - b + b * len(c["tokens"]) / avg)) for t in q if t in tf)
        if s > 0:
            # Phrase bonus: "late blight" should beat a passage that only says "blight".
            joined = " ".join(c["tokens"])
            s += 3.0 * sum(f"{a} {b}" in joined for a, b in zip(q, q[1:]))
            scored.append((s, c))
    scored.sort(key=lambda x: -x[0])
    return [{**{k_: v for k_, v in c.items() if k_ != "tokens"}, "score": round(s, 2)} for s, c in scored[:k]]
