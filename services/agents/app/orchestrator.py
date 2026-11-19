"""Orchestrator agent: sits above the specialists, reads one finished run and reports what each agent saw and did.

It decides nothing. The specialists propose, the TypeScript safety engine decides, a person approves; this only summarises.
The summary is rule-based (always available); Gemini only rephrases it when a key is set, and never adds facts.
"""
from . import llm

AGENTS = {  # action kind -> agent that owns it
    "irrigate": "Irrigation and weather agent", "dose_ph": "Fertigation agent (pH and nutrients)",
    "dose_nutrient": "Fertigation agent (pH and nutrients)", "ventilate": "Climate agent", "shade": "Climate agent",
    "treat_disease": "Disease agent", "alert": "Sensor-health agent",
}
ALL_AGENTS = ["Irrigation and weather agent", "Fertigation agent (pH and nutrients)", "Disease agent", "Sensor-health agent"]


def _saw(name: str, snap: dict, weather: dict, images: list) -> str:
    def vals(metric):
        return ", ".join(f"{z} {metric} {m[metric]['value']}{m[metric].get('unit', '')}" for z, m in snap.items() if metric in m)
    if name.startswith("Irrigation"):
        rain = (weather or {}).get("rain_next_window_mm")
        return (vals("soil_moisture") or "no soil-moisture reading") + (f"; forecast rain {rain} mm" if rain is not None else "")
    if name.startswith("Fertigation"):
        return "; ".join(x for x in (vals("ph"), vals("ec")) if x) or "no pH/EC reading"
    if name.startswith("Disease"):
        return f"{len(images)} new camera photo(s)" if images else "no new camera photo"
    return "data quality of every sensor"


def build(values: dict, status: str, mode: str, hardware: list[dict]) -> dict:
    snap, plan, verdicts = values.get("snapshot", {}), values.get("plan", []), {v["proposal_id"]: v for v in values.get("verdicts", [])}
    approvals = {a["proposal_id"]: a for a in values.get("approvals", [])}
    dispatched = {d["proposal_id"]: d for d in values.get("dispatched", [])}
    images = (values.get("scenario") or {}).get("images", [])
    rows = {n: [] for n in ALL_AGENTS}
    for p in plan:
        v = verdicts.get(p["id"], {})
        d = dispatched.get(p["id"])
        a = approvals.get(p["id"])
        state = ("vetoed" if v.get("verdict") == "veto" else "dispatched" if d and d["status_code"] in (200, 201)
                 else "rejected" if a and a["decision"] == "reject" else "awaiting approval" if v.get("needs_human") else "allowed")
        rows.setdefault(AGENTS.get(p["kind"], "Sensor-health agent"), []).append({
            "id": p["id"], "kind": p["kind"], "zone": p["zone"], "params": p["params"], "why": p["rationale"],
            "expected": p["expected_effect"], "verdict": v.get("verdict"), "rule": v.get("invariant"), "verdict_reason": v.get("reason"),
            "needs_human": bool(v.get("needs_human")), "state": state, "hardware": (d or {}).get("hardware")})
    weather = values.get("weather") or {}
    agents = []
    for n in ALL_AGENTS:
        acts = [a for a in rows[n] if a["kind"] != "alert" or n.startswith("Sensor") or n.startswith("Disease")]
        status_ = ("acting" if any(a["state"] in ("dispatched", "allowed", "awaiting approval") for a in acts)
                   else "held back by safety" if any(a["state"] == "vetoed" for a in acts) else "all clear")
        agents.append({"name": n, "saw": _saw(n, snap, weather, images), "status": status_, "actions": acts})
    pending = [a for ag in agents for a in ag["actions"] if a["state"] == "awaiting approval"]
    done = [a for ag in agents for a in ag["actions"] if a["state"] == "dispatched"]
    vetoed = [a for ag in agents for a in ag["actions"] if a["state"] == "vetoed"]
    lines = []
    for a in pending:
        lines.append(f"{AGENTS.get(a['kind'])} proposes {a['kind'].replace('_', ' ')} on {a['zone']} ({a['why']}); the safety engine allows it and it waits for a person.")
    for a in done:
        lines.append(f"{a['kind'].replace('_', ' ')} on {a['zone']} was approved and queued for the {a['hardware']['device'] if a['hardware'] else 'device'} (hardware not connected yet).")
    for a in vetoed:
        lines.append(f"The safety engine blocked {a['kind'].replace('_', ' ')} on {a['zone']}: {a['verdict_reason']}")
    if not lines:
        lines.append("All agents report normal readings. Nothing to do.")
    summary = " ".join(lines)
    by = "rules"
    if llm.chat_enabled():
        try:
            out = llm.chat_model(fallback=True, timeout=15).invoke(
                "You are the orchestrator of a farm AI system. Rewrite these facts as 2-3 short plain sentences for a farmer. "
                "Do not add facts, numbers or advice that are not listed.\n\n" + summary).content
            out = out if isinstance(out, str) else "".join(b.get("text", "") for b in out if isinstance(b, dict))
            # An LLM must never overstate a safety state: reject a rephrase that says "approved" when nothing was dispatched.
            if out.strip() and not ("approved" in out.lower() and not done):
                summary, by = out.strip(), "rules+llm"
        except Exception:  # noqa: BLE001 - quota or network: keep the rule-based summary
            pass
    return {"run_id": values["run_id"], "status": status, "data_source": mode, "sim_time": values["sim_time"], "agents": agents,
            "orchestrator": {"summary": summary, "by": by, "awaiting_approval": len(pending), "dispatched": len(done), "blocked": len(vetoed)},
            "hardware_queue": hardware}
