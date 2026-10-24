"""Add Wikipedia articles (CC BY-SA 4.0) to data/knowledge/ in the same format as the existing wiki_*.md files.
    python scripts/fetch_wiki_knowledge.py Fenugreek:methi,fenugreek Coriander:coriander,cilantro,dhania
Needs network. Plain-text extract, trimmed before the References/See also sections."""
import json, re, sys, urllib.parse, urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "data" / "knowledge"
for arg in sys.argv[1:]:
    title, _, aliases = arg.partition(":")
    q = urllib.parse.urlencode({"action": "query", "prop": "extracts|revisions", "rvprop": "ids", "explaintext": 1,
                                "titles": title, "format": "json", "redirects": 1})
    req = urllib.request.Request("https://en.wikipedia.org/w/api.php?" + q, headers={"User-Agent": "solarda-hackathon/1.0"})
    page = next(iter(json.load(urllib.request.urlopen(req))["query"]["pages"].values()))
    body = re.split(r"\n== (?:See also|References|External links|Further reading|Notes) ==", page["extract"])[0].strip()
    slug = page["title"].replace(" ", "_")
    (OUT / f"wiki_{slug.lower()}.md").write_text(
        f"---\nid: wiki:{slug}\ntitle: {page['title']}\nsource: https://en.wikipedia.org/wiki/{slug} (revision {page['revisions'][0]['revid']})\n"
        f"licence: CC BY-SA 4.0 (Wikipedia contributors). Changes: trimmed after the main text.\naliases: {aliases or page['title'].lower()}\n"
        f"approved_for: background on the crop and growing method; NOT for product or dose advice\n---\n{body}\n", encoding="utf-8")
    print("wrote", slug, len(body))
