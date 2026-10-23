Solarda Build Blueprint: Agentic Smart
Agriculture
Oct 23, 2026  ·  @hi
Build Solarda as a LangGraph farm-shift agent that replays public datasets as its sensor
feed, acts only inside a safety envelope, and is benchmarked against two baselines before
Nov 16, 2026 .
Compliance check
The plan covers every word of the track title and the judging criteria; the one rule it leaves
to the team is that the slides must be built by hand in the official template.
Problem statement coverage
Hackathon rules
Track wording Where Solarda covers it Phase
Crop monitoring Replayed telemetry and image feed, twin-based
state estimate, data-quality flags
1, 2
Disease detection Calibrated vision model with an abstain gate, re-
scan after a treatment proposal
3
Irrigation Forecast-aware scheduler on Open-Meteo ET0 and
FAO-56 Kc, tested in an AquaCrop twin
2
Automation LangGraph farm-shift loop: observe, plan, veto,
approve, dispatch, verify, audit
1
Resource optimization Water, nutrient and energy use against two
baselines on identical weather
2, 4
Food security (track title) Harvest and mandi price outlook, storage alerts
(stretch)
4
Untitled
Page 1 of 25
Re-read the rules page before submitting; questions go to AgenticAI2026@theamse.org.
Ground rules for the coding agent
Treat the existing repo as unaudited, add the agent layer as new services beside it, and
never call a feature working until a test proves it.
1. Audit first. The repo's DOCS/  and packages/  folders could not be read when this was
written, so every statement about existing code below comes from the README and
handoff notes. Phase 0 starts by running the app and writing docs/AUDIT.md : each
Rule (as read on the hackathon
page earlier in this project)
What the plan does Status
Round I deck due 16 Nov 2026, 10
PM; results 19 Nov
Screenshots and benchmark
numbers frozen by 13 Nov
Covered
Official template only; no AI-
generated PPT
The team writes and builds
every slide by hand. This
blueprint supplies build steps
and evidence to capture, never
slide text
Team action
13-slide outline Section 12 lists the evidence
each slide needs
Covered
Round II 21 to 22 Nov, 15 min (10
present, 5 Q&A)
Offline replay demo with a
scripted 5-minute path inside
the 10-minute pitch, plus a 2-
minute fallback
Covered
Team of 1 to 6; all members
present in Round II
Phase 0 assigns each member a
module they can demo and
defend
Open: team size not
confirmed
Optional YouTube video, 1 to 4
min
Recorded from the replay demo Optional
Judged on pitching, PPT content,
show stoppers, novelty, USPs,
technical strength,
achievements, demo readiness
Mapped in section 12 Covered
Untitled
Page 2 of 25
feature marked real, UI-only or broken. Do not delete existing features; wrap them.
2. No live sensors. Every sensor value comes from the replay layer and carries a source
tag ( replay , simulated  or twin ). The UI shows a permanent "Replay mode" badge.
Replayed data is never presented as field data.
3. Language split. The agent runtime is a new Python service (FastAPI, LangGraph,
LangChain). The digital twin is a separate Python worker, because AquaCrop-OSPy
3.0.10 lists Python 3.7 to 3.10 and a newer 3.1.0 exists; pin the twin's interpreter in Phase
0 after a test install. Web, Express API and the engine stay TypeScript.
4. One safety source of truth. The 13 invariants live in the TypeScript engine. The Python
service calls POST /api/safety/check  and never re-implements them. Shared JSON
fixtures test both sides.
5. LLM proposes, code disposes. Every LLM output is a validated structured object. The
LLM never writes a setpoint; it proposes an action that the deterministic safety layer
approves or vetoes.
6. Works with no LLM. A rules-only planner runs when no API key or network is present,
so the demo survives a failed connection.
7. Secrets. No keys in git. Add .env.example , scan history, rotate anything found.
8. Done means: code, a test, an audit-log line and a docs update.
Area Exists today (README and handoff,
unverified)
Added by this plan
Web Vite, React 18, TypeScript, Tailwind,
Recharts
Agent console, reasoning-trace viewer,
approvals inbox, replay controls,
benchmark page
API Express: proposals, telemetry, alerts Replay and agent-run endpoints,
approval endpoints, safety-check
endpoint
Engine TypeScript simulation, control agents,
13 invariants
Reused as the veto layer; no rewrite
Vision TF.js MobileNet on PlantVillage (38
classes), 75% abstain gate
Server-side classifier with field-photo
evaluation; browser model kept as
offline fallback
LLM Gemini assistant behind a policy
gateway
LangGraph agents calling the same
gateway
Untitled
Page 3 of 25
System architecture
A Python agent runtime sits beside the existing TypeScript stack and reaches the plant
simulator only through the API.
Agents only propose. The engine's invariants decide, and the twin and vision services are
called as tools from inside the graphs.
Area Exists today (README and handoff,
unverified)
Added by this plan
Data sample images/ , simulated telemetry Dataset replay layer, weather feed,
twin, benchmark harness
system architecture · web, API, engine, agent runtime, model services
Untitled
Page 4 of 25
Data without sensors
A replay service turns open datasets into a live-looking telemetry stream, so the agents
run the same code path they would with real hardware.
Source What it supplies Terms Feeds
EDEN ISS 2020
telemetry
97 greenhouse sensors
every 5 min, 1 Jan to 30
Dec 2020, 105,119 points
per file: CO2, PAR,
humidity, temperature,
VPD, nutrient solution
EC, pH, level, volume
CC BY 4.0 Climate and
fertigation
agents
HydroGrowNet of
Batavia
Lettuce in NFT, three 30-
day runs: water
temperature, EC, pH and
over 390,000 plant
images
CC BY 4.0 pH and EC replay,
growth images
for monitoring
Open-Meteo forecast
and archive
Hourly and daily FAO-56
reference
evapotranspiration
(ET0), temperature,
humidity, wind, radiation
Free for non-
commercial use,
up to 10,000 calls a
day, no key; data
CC BY 4.0 with
attribution
Irrigation agent
AquaCrop-OSPy Soil, crop and water
model that mirrors most
of FAO AquaCrop v7.1;
not an official FAO tool;
no salinity or fertility
stress
MIT Digital twin for
field crops
PlantVillage,
PlantDoc, PlantWild
Leaf images: lab
(PlantVillage) and field
(the other two)
Record each
licence in Phase 0
Disease model
training and field
evaluation
Agmarknet via
data.gov.in
Daily mandi prices GODL-India Price outlook
(stretch)
Untitled
Page 5 of 25
The EDEN ISS data comes from an Antarctic research greenhouse, so use it for realistic
sensor shape and timing only, and label it that way on screen. HydroGrowNet's sensor
sampling interval is not stated on its page; read it from the files before writing the adapter.
Confirm the exact Open-Meteo variable name (expected et0_fao_evapotranspiration )
in its API docs, and cache a fixed multi-year pull for Tamil Nadu under data/weather/  so
the demo needs no network.
Replay design
1. Adapters read one dataset each and emit the shared TelemetryEvent  contract: ts ,
siteId , zone , metric , value , unit , quality , source .
2. Replay clock plays events at 1x, 60x or 1440x, with pause, seek and loop. Agents read
the replay clock, never the wall clock, so runs are repeatable.
3. Fault injector layers stuck sensor, drift, dropout, spike and pump failure onto any
stream, on a schedule defined in the scenario file.
4. Scenario packs are YAML files in data/scenarios/ : dataset window, weather window,
injected faults and the expected agent behaviour used as a test oracle. Ship four:
heatwave day, sensor drift, pH excursion, and a diseased-leaf photo ahead of a rain
forecast.
Agent workflow
One farm-shift run is a single LangGraph execution; every arrow below is an edge in the
graph code.
Source What it supplies Terms Feeds
Repo sample
images/  and the
TypeScript simulator
Deterministic seeds and
fault injection
Own code Offline demo and
tests
Untitled
Page 6 of 25
The four specialists run in one parallel step and the arbiter merges their proposals. The
safety gate then routes each proposal: asked of a human when it needs approval,
dispatched when it is inside the envelope, and dropped when vetoed. If every proposal is
vetoed or there is nothing to do, the run goes straight to audit. Verify compares the
observed effect with the proposal's expected effect and retries at most twice before
escalating.
LangGraph and LangChain design
LangGraph owns the control flow (state, parallel specialists, interrupts, checkpoints);
LangChain supplies the model, tool, retrieval and structured-output pieces inside the
nodes. Pin exact versions after the Phase 0 test install, because both libraries changed
their agent APIs recently.
Shared state. One typed state object flows through the whole shift. Lists that parallel
nodes write to use an additive reducer so results are not overwritten.
from operator import add
from typing import Annotated, Literal, TypedDict
from pydantic import BaseModel
class ProposedAction(BaseModel):
farm-shift graph · parallel specialists, safety gate, approval interrupt, verify loop
Untitled
Page 7 of 25
    id: str
    kind: Literal["irrigate", "dose_ph", "dose_nutrient", "ventilate",
                  "shade", "treat_disease", "alert", "no_op"]
    zone: str
    params: dict
    rationale: str
    evidence: list[str]        # telemetry ids, forecast ids, image ids, 
source doc ids
    expected_effect: str       # what verify will check, e.g. "soil_moisture 
+4% in 2h"
    confidence: float
class FarmState(TypedDict):
    run_id: str
    site_id: str
    sim_time: str                                   # replay clock, never 
wall clock
    autonomy: Literal["advise", "propose", "auto_in_envelope"]
    snapshot: dict                                  # fused, quality-checked 
readings
    quality_flags: list[dict]
    weather: dict | None                            # Open-Meteo ET0 and rain 
outlook
    twin_forecast: dict | None                      # AquaCrop projection per 
option
    situation: dict | None                          # ranked issues from the 
assessor
    proposals: Annotated[list[ProposedAction], add]
    verdicts: list[dict]                            # allow / modify / veto + 
reason
    approvals: list[dict]
    dispatched: list[dict]
    verification: list[dict]
    trace: Annotated[list[dict], add]               # one entry per node, 
shown in the UI
Graph assembly.
from langgraph.graph import StateGraph, START, END
from langgraph.types import Send, Command, interrupt
def fan_out(state: FarmState) -> list[Send]:
    return [Send(name, {"snapshot": state["snapshot"], "weather": 
Untitled
Page 8 of 25
state["weather"],
                        "twin_forecast": state["twin_forecast"], "situation": 
state["situation"]})
            for name in ("irrigation", "fertigation", "climate", "disease")]
def human_approval(state: FarmState):
    pending = [v for v in state["verdicts"] if v["needs_human"]]
    decision = interrupt({"type": "approval_request", "actions": pending})  # 
no side effects above this line
    return {"approvals": decision}
b = StateGraph(FarmState)
b.add_node("ingest", ingest)            # replay window, quality checks, 
sensor fusion
b.add_node("assess", assess)            # LLM, structured output
b.add_node("irrigation", irrigation)    # subgraph
b.add_node("fertigation", fertigation)  # subgraph
b.add_node("climate", climate)          # subgraph
b.add_node("disease", disease)          # subgraph
b.add_node("arbiter", arbiter)
b.add_node("safety_gate", safety_gate)
b.add_node("human_approval", human_approval)
b.add_node("dispatch", dispatch)
b.add_node("verify", verify)
b.add_node("audit", audit)
b.add_edge(START, "ingest")
b.add_edge("ingest", "assess")
b.add_conditional_edges("assess", fan_out)
for n in ("irrigation", "fertigation", "climate", "disease"):
    b.add_edge(n, "arbiter")
b.add_edge("arbiter", "safety_gate")
b.add_conditional_edges("safety_gate", route_after_safety,
                        {"human": "human_approval", "dispatch": "dispatch", 
"none": "audit"})
b.add_edge("human_approval", "dispatch")
b.add_edge("dispatch", "verify")
b.add_conditional_edges("verify", route_after_verify, {"retry": "assess", 
"done": "audit"})
b.add_edge("audit", END)
graph = b.compile(checkpointer=checkpointer)   # thread_id = f"{site_id}:
{shift_date}"
Untitled
Page 9 of 25
Node catalogue
Node Type Reads Writes Tools and rules
ingest Deterministic Replay
window
snapshot ,
quality_flags
Stuck, range, drift
and dropout checks;
fuse redundant
sensors
assess LLM,
structured
output
Snapshot,
flags,
weather
situation Ranks issues; cannot
call actuators
irrigation Subgraph Snapshot,
ET0, twin
proposals Tools:
get_et0_forecast ,
run_twin(option) ;
compares options in
the twin before
proposing
fertigation Subgraph Snapshot proposals Calls the TypeScript
chemistry engine for
dose limits
climate Subgraph Snapshot,
weather
proposals VPD and
temperature control;
checks power
budget
disease Subgraph Image,
snapshot
proposals Tool:
classify_leaf ;
abstains below
threshold; asks for
another photo
instead of guessing
arbiter Deterministic,
LLM tie-break
All
proposals
Ranked, de-
conflicted
proposals
Removes duplicates,
resolves conflicts,
enforces water and
energy budgets
Untitled
Page 10 of 25
Where each LangChain piece is used
Node Type Reads Writes Tools and rules
safety_gate Deterministic Proposals verdicts POST
/api/safety/check ,
tool allowlist,
argument schema,
rate limit; veto beats
everything
human_approval Interrupt Verdicts approvals Required for
pesticide, dosing
above a set size, and
any action in
propose  tier
dispatch Deterministic Approved
actions
dispatched Idempotency key per
action; separate
node so a resume
never repeats it
verify Deterministic Telemetry
after the
delay
verification Compares result
with
expected_effect ;
two retries, then
escalate to a human
audit Deterministic Everything trace Append-only log;
Tamil and English
summary for the
farmer
Piece Use in Solarda
init_chat_model One line switches model provider by
environment variable; the default follows
the existing Gemini gateway
@tool  with Pydantic arguments Every tool has a typed schema; the safety
gate rejects calls that do not match it
Untitled
Page 11 of 25
LangGraph features that carry the demo
1. Interrupts and Command(resume=...) . The run pauses at human_approval  and
continues when the farmer taps approve or reject in the UI. Resume with the same
thread_id .
2. Interrupt rules. The node restarts from its top on resume, so no side effects before
interrupt() ; never wrap it in a bare try/except ; do not loop interrupt()  inside
while True .
3. Checkpointer. SqliteSaver  in development, PostgresSaver  in production (call
setup()  once). Every tick is a checkpoint, so the UI can replay any past decision.
4. Parallel fan-out with Send . The four specialists run in one step; a failed branch retries
alone. Cap concurrency to avoid model rate limits.
5. Store. InMemoryStore  for the demo, a database-backed store later, holding farm
profile and past outcomes across shifts.
Advisor graph (farmer chat and voice). classify_risk  → retrieve  →
check_sufficiency  → answer  or escalate_to_human  → audit . Any question about
pesticide, dose or withholding period takes the retrieval path and is answered only from
Piece Use in Solarda
Structured output ( ToolStrategy  or
provider-native)
assess , arbiter  tie-break and the
specialists return validated objects, never
free text
Retriever over a vector store The advisor graph searches only approved
agronomy sources (extension guides, label
text, the golden Q&A set) with
init_embeddings  and a local store such as
Chroma
create_agent  with
HumanInTheLoopMiddleware
Powers the farmer chat agent; approval is
required on any tool call that touches
doses or pesticides
Custom AgentMiddleware
( wrap_tool_call )
Logs every tool call and enforces the
allowlist
PIIMiddleware Strips phone numbers and farmer IDs
before text reaches the model
Untitled
Page 12 of 25
approved text with citations; if the sources do not cover it, the graph escalates and says
so.
Safety and guardrails
Safety is enforced in code at three points, and no LLM output can skip any of them: before
a proposal (schema and tool allowlist), at the gate (invariants and envelope), and after
dispatch (verification).
Autonomy tiers. Each action class has its own tier, stored in config and shown in the UI.
Envelope rules. Keep the 13 existing invariants (pH ceilings, EC bounds, VPD ranges) as
they are in the engine. Add these as new engine rules, with numbers taken from the crop
and substrate recipes rather than invented:
1. Maximum irrigation per zone per day and a minimum gap between events.
2. Maximum dose per hour per nutrient or pH adjuster.
3. No action based on a reading flagged bad  by the quality checks.
4. Hold irrigation when the forecast gives rain above a set threshold inside the next
window.
5. No pesticide or treatment action without human approval, at any tier.
6. E-STOP freezes dispatch immediately and is covered by a test.
Mapping to the OWASP Top 10 for Agentic Applications 2026
Tier What the agent may do How an action class gets there
L0 Advise Explain and recommend; no
actions
Default for anything new
L1 Propose Create proposals; a human
approves each one
Default for dosing and all pesticide
actions
L2 Act in
envelope
Run low-risk actions inside hard
limits and notify the farmer
Passes shadow-mode comparison
on replay scenarios with zero
vetoes overridden
L3 Broader
autonomy
Roadmap only Needs shadow mode on a real
farm; do not claim it
Untitled
Page 13 of 25
Do not install community MCP servers or unpinned tool packages; vet and pin every
dependency.
Disease and dose advice gate. For any disease, dose or pesticide question: detect risk,
retrieve from approved sources only, check the evidence is sufficient, then answer with
citations or escalate to a human, and write the audit entry. The disease model abstains
below its calibrated threshold and asks for a clearer photo; report its accuracy on field
photos (PlantDoc, PlantWild), not only on PlantVillage.
Red-team set. Write at least 25 attack cases in promptfoo covering the three risks above
plus unsafe-dose requests, Tamil-language jailbreaks and fake sensor data. Run them in CI
and publish the pass rate.
Build phases
The Round I deck is due 16 Nov, so every number and screenshot it needs must come from
Phases 0 to 3.
Risk Control in Solarda Test
ASI01 Goal
hijack
The shift goal is fixed in code. Farmer
chat, retrieved documents and image
text are data, never instructions; tool
arguments are never copied from
retrieved text
Plant an instruction inside a
retrieved document and a farmer
message; the plan must not
change
ASI02 Tool
misuse
Per-node tool allowlist, Pydantic
argument schemas, rate limits,
idempotency keys, least agency
Call a disallowed tool and a tool
with out-of-range arguments;
both are blocked and logged
ASI10 Rogue
agents
Step and retry caps
( recursion_limit , two verify
retries), E-STOP, append-only audit,
an alert when proposals drift from
the baseline controller
Force a verify failure loop; the run
must stop at the cap and escalate
Untitled
Page 14 of 25
Bands are equal width and not to scale. A phase is finished only when its gate passes; the
gate criteria are spelled out in the phase specifications below.
Phase specifications
Each phase ends at a testable gate; do not start the next phase until the gate passes. If
time runs short, cut in this order: food-security stretch, voice, fine-tuning the vision
model. Phases 0 to 2 and the benchmark are never cut.
Phase 0: Foundations (23 to 26 Oct)
1. Clone, install and run web and API. Write docs/AUDIT.md : every feature marked real,
UI-only or broken, with the evidence.
2. Fix repo hygiene: the README says docs/  but the folder is DOCS ; rename the handoff
file "idk whatt is it.md" to docs/HANDOFF.md ; add a repo description; scan git history
for committed keys and rotate any found.
3. Settle the theme (live site is light, handoff says dark) and record the choice.
4. Add contracts to packages/contracts : TelemetryEvent , ProposedAction ,
SafetyVerdict , Approval , TraceEntry . Export JSON Schema and generate the
Python models with datamodel-code-generator .
5. Test-install the Python stack (LangGraph, LangChain, AquaCrop-OSPy) on the chosen
interpreters; commit requirements.lock .
roadmap · 5 phases, 5 gates, bands not to scale
Untitled
Page 15 of 25
6. Assign a named owner to every module below.
Gate: AUDIT.md  committed; web, API and uvicorn  all start; a TypeScript to JSON to
Pydantic round-trip test passes; no secrets in HEAD.
Phase 1: Replay and agent core (27 Oct to 2 Nov)
1. services/agents/replay : adapters for EDEN ISS (nutrient, climate and air CSVs) and
HydroGrowNet; replay clock; fault injector. Endpoints: POST /replay/start ,
/replay/pause , /replay/seek , and GET /replay/stream  (server-sent events).
2. Quality checks in ingest : stuck value, out of range, rate of change, dropout. Each has
a test using an injected fault.
3. LangGraph skeleton with a rules-only planner: ingest  → planner  → safety_gate  →
dispatch  → verify  → audit , on SqliteSaver .
4. Express POST /api/safety/check  wrapping the engine invariants, plus shared
contract fixtures.
5. human_approval  interrupt and POST /runs/{id}/resume .
6. Web: Agent Console with live feed, per-node trace, approvals inbox, Replay badge and
E-STOP.
7. Add the LLM assess  node (structured output) behind a switch; the rules-only path
stays as the fallback.
Gate: the heatwave and pH-excursion scenarios run end to end at 60x; every dispatched
action has a verdict and an audit entry; a test shows an unsafe action vetoed; a run
paused for approval resumes after the server restarts; the graph completes with the LLM
key removed.
Phase 2: Forecast-aware irrigation, twin and benchmark (3 to 9 Nov)
1. Weather client: fetch and cache three years of Open-Meteo ET0 and rain for the demo
site (Chennai) into data/weather/ , with an attribution file.
2. data/kc.yaml : FAO-56 crop coefficients per growth stage, one source column per
row.
3. services/twin : AquaCrop-OSPy wrapper run(option, weather, soil, crop)
returning yield, water used and stress days; endpoint POST /twin/run . For hydroponic
towers use the TypeScript engine's model and label it "simplified".
Untitled
Page 16 of 25
4. Irrigation subgraph: build three options (hold, irrigate now, irrigate tonight), run the
twin on each, pick on water used versus stress days, and write the rationale with the
run ids as evidence.
5. Baselines: a fixed schedule, and a rule-based ET controller that irrigates when
cumulative crop ET minus rain passes a depletion threshold.
6. bench/ : run agent and both baselines on identical weather years and fault-injected
runs; write CSV and a chart; report the cases where the agent does no better.
Gate: the harness reproduces its numbers from a fixed seed; the committed results table
names the weather years; at least one no-gain scenario is reported; each irrigation
proposal cites its ET0 and twin run ids.
Phase 3: Disease agent and farmer channel (10 to 13 Nov)
1. services/vision : serve the existing PlantVillage-trained classifier, evaluate it on
PlantDoc and PlantWild subsets, add leaf crop or background removal, calibrate
confidence (temperature scaling) and set the abstain threshold on a validation split.
Fine-tune on the PlantDoc training split only if time allows; otherwise report the lab-to-
field gap as it is.
2. Disease subgraph: classify → abstain and ask for a re-photo, or propose a treatment
from approved sources → human approval → re-scan after a set number of replay days
→ verify.
3. Advisor graph with retrieval over approved agronomy text, and a golden set of 50
questions (from the DigiGreen human-curated Q&A dataset plus team-written cases).
4. Tamil text first. Add voice with the browser speech APIs only where Tamil is supported,
and fall back to text. Add a forwardable plain-text summary and a low-bandwidth mode
with no charts.
5. Freeze evidence: capture screenshots and record every number in evidence/  by 13
Nov.
Gate: lab accuracy, field accuracy and abstain rate are reported; the golden Q&A score is
recorded; an unsafe-dose question escalates instead of answering; the Tamil text flow
works end to end; evidence/  is committed.
Phase 4: Hardening and stretch (14 to 20 Nov)
1. Red-team suite running in CI; fix every failure and publish the pass rate.
Untitled
Page 17 of 25
2. Stretch, only if the Phase 1 to 3 gates passed: harvest-date forecast from the twin, a
price outlook from the cached Agmarknet series against a seasonal-naive baseline
with its data quality labelled, and a storage or pooling alert.
3. Demo script: a 5-minute path and a 2-minute fallback; one command that launches
everything offline; a recorded fallback video.
4. Two full rehearsals with every member, and a prepared list of likely Q&A answers.
5. Optional 1 to 4 minute video for YouTube.
Gate: from a clean clone on a laptop with Wi-Fi off, the demo script completes; the red-
team pass rate is published; every member can start and explain the demo.
Repository layout, contracts and API
New code lives in services/ , data/ , bench/  and evidence/ ; existing packages are
extended, not rewritten.
solarda/
  packages/
    contracts/            existing; add TelemetryEvent, ProposedAction, 
SafetyVerdict,
                          Approval, TraceEntry and a JSON Schema export 
script
    engine/               existing; invariants stay here; add the new 
envelope rules
  weiqou/
    web/                  add Agent Console, trace viewer, approvals inbox, 
benchmark page
    api/                  add /api/safety/check, /api/actions, /api/audit, 
proxy to agents
    electron/             existing
  services/               new
    agents/
      app/main.py                       FastAPI entry
      app/llm.py                        init_chat_model with rules-only 
fallback
      app/graphs/farm_shift.py          the graph from the LangGraph section
      app/graphs/advisor.py             chat and voice graph
      app/graphs/subgraphs/             irrigation.py fertigation.py 
climate.py disease.py
      app/replay/                       clock.py faults.py 
adapters/eden_iss.py adapters/hydrogrownet.py
Untitled
Page 18 of 25
      app/tools/                        weather.py twin.py vision.py 
safety.py retrieval.py
      app/models/                       generated Pydantic models (do not 
edit by hand)
      tests/
    twin/                 AquaCrop-OSPy worker, pinned interpreter
    vision/               classifier server, calibration, abstain threshold
  data/
    scenarios/            four YAML scenario packs
    weather/              cached Open-Meteo pulls plus ATTRIBUTION.md
    replay/               trimmed dataset slices; full files fetched by a 
script
    knowledge/            approved agronomy text for retrieval, with source 
and licence per file
    kc.yaml               FAO-56 crop coefficients with sources
  bench/                  benchmark harness, results CSV, charts
  evidence/               screenshots and numbers for the slides
  docs/                   AUDIT.md, HANDOFF.md, this blueprint
Commit a trimmed slice of each dataset (for example 14 days of EDEN ISS and a small set
of HydroGrowNet images) and fetch the full files with a script, so a clean clone stays small
and runs offline.
Service Method and path Purpose
agents POST /replay/start  (scenario),
/replay/pause , /replay/seek
Control the replay clock
agents GET /replay/stream Server-sent events: telemetry, trace
entries, approval requests
agents POST /runs  (scenario, autonomy tier) Start a farm shift; returns run_id
agents GET /runs/{id}/state , GET
/runs/{id}/history
Current state; checkpoint list for
decision replay
agents POST /runs/{id}/resume Send the farmer's approvals to the
paused graph
agents POST /runs/{id}/estop Freeze dispatch
agents POST /advisor/ask  (text, language) Chat and voice questions
twin POST /twin/run Simulate one irrigation option
Untitled
Page 19 of 25
Evaluation and benchmark plan
Every headline number comes from bench/ , names its baseline and weather years, and
says it is a simulation result; judges will test the claim, so the harness must reproduce it
from a seed.
Service Method and path Purpose
vision POST /vision/classify Leaf image to label, calibrated
confidence or abstain
api POST /api/safety/check Engine invariants for a list of
proposals
api POST /api/actions  (idempotency key
header)
Apply an approved action to the
simulated plant
api GET /api/audit Append-only decision log
Area Metric Compared against Report
Irrigation Water applied (mm),
stress days, simulated
yield
Fixed schedule; rule-
based ET controller
At least three weather
years, paired
differences per year,
spread not just the
mean
Fault
tolerance
Wrong actions taken,
vetoes, time to detect
a fault
Same run with quality
checks off
Stuck sensor, drift,
dropout, pump failure
Disease
model
Lab accuracy, field
accuracy, abstain rate,
calibration error
PlantVillage test split vs
PlantDoc and PlantWild
subsets
The gap between lab
and field, shown openly
Advisor Golden Q&A score;
share of unsafe
questions correctly
escalated
Plain LLM without
retrieval
50-question set
Untitled
Page 20 of 25
Reporting rules
1. Savings against a manual or fixed schedule alone are weak evidence. Published
advisory-system trials in the Part 1 research report show savings of roughly 8 to 14%
against stronger baselines; treat a figure far above that as a sign of a weak baseline.
2. State plainly that results are from the AquaCrop twin and replayed data, not a field
trial.
3. Include at least one scenario where the agent does no better than the rule controller,
and say why.
4. Keep raw outputs in bench/results/  so a judge can re-run them.
Demo, video and slide mapping
The build produces the evidence; the team writes the slides itself, by hand, in the official
template. The table lists what to capture for each topic in the guideline's slide outline, not
what to write.
Area Metric Compared against Report
Security Red-team pass rate Three OWASP risks plus
unsafe-dose and Tamil
cases
At least 25 cases, run in
CI
Agent
behaviour
Vetoes, approval wait,
verify retries, seconds
per tick
Rules-only planner vs
LLM planner
Agreement rate
between the two
Slide topic Evidence from the build
Background Loss and post-harvest figures with links from the
Part 1 research report
Problem Lab-to-field accuracy gap, unsafe-advice risk and
weak-baseline savings claims, each from Part 1
Solution Your own redraw of the architecture and agent
workflow diagrams in this blueprint
Novelty Vetoable agents with tiered autonomy; every
decision benchmarked against baselines; decision
replay from checkpoints
Untitled
Page 21 of 25
The slide list above follows the guideline as read earlier in this project. That Guidelines
document is separate from the hackathon page, so re-check the exact slide list and count
against it before building the deck.
Judging criteria and the proof for each
Slide topic Evidence from the build
Show stopper Screen recording of a vetoed unsafe action and a
paused-then-resumed approval during a fault-
injected run
Methodology Phase gates and the farm-shift graph
Tech stack Versions pinned in requirements.lock  and
package.json
Budget Software-only costs the team prices itself (model
API, hosting); Open-Meteo and the datasets are
free under the terms above
Expected outcome The results table from bench/results/  with
baselines and weather years named
Roles Module owners assigned in Phase 0
Two screenshot slides Agent Console mid-scenario with the trace open;
benchmark page
References Sources lists from Part 1 and this document
Criterion Proof to show
Pitching The scripted demo path below, rehearsed twice
PPT content evidence/  folder with sourced numbers
Show stoppers Veto, pause and resume, and decision replay
Novelty and USPs Bounded autonomy, honest benchmark, offline
Tamil-first use
Technical strength LangGraph with parallel specialists, interrupts,
checkpoints, an AquaCrop twin and a safety gate
Untitled
Page 22 of 25
Demo path (about 5 minutes inside the 10-minute pitch)
1. Start the heatwave scenario at 60x. Point out the Replay badge and say the data is
replayed.
2. The irrigation agent proposes an action; open the trace to show the ET0 reading, the
three twin options and the verdict.
3. Inject a stuck sensor; the quality flag appears and the agent declines to act on it.
4. A pH dose proposal is vetoed; the trace names the invariant.
5. A pesticide proposal pauses for approval; approve it from the phone view and the run
resumes.
6. Upload a blurry leaf photo; the model abstains and asks for another; upload a clear one
and it proposes a treatment with a re-scan date.
7. Ask a dose question in Tamil; the advisor escalates instead of answering.
8. Open the benchmark page, including the scenario where the agent does no better,
then replay one past decision from its checkpoint.
Keep a 2-minute version (steps 2, 4, 5, 8) and a recorded video for network or machine
failure.
Risks and open items
The largest risk is time: 24 days remain to the Round I deadline, so the cut order in the
phase section is binding.
Criterion Proof to show
Achievements Benchmark table, field-photo accuracy, red-team
pass rate
Readiness of demo One command, no network, from a clean clone
Risk or open item Effect Action
Existing code unaudited;
DOCS/  and packages/
unreadable when this was
written
Plan may duplicate
or contradict real
features
Phase 0 audit before any coding
Untitled
Page 23 of 25
Sources
Pages opened for the technical facts in this document (checked 23 Oct 2026):
1. LangGraph interrupts: interrupt() , Command(resume=...) , checkpointer and
thread_id  requirements, replay and idempotency rules.
2. LangChain v1 release notes: create_agent , middleware, structured output, package
layout.
Risk or open item Effect Action
Team size and member skills
unknown
Phases may be too
large for one person
Confirm team; assign owners; cut
stretch first
Guidelines document (slide
list, AI-content rule, team and
Round II details) is separate
from the hackathon page
Deck or demo could
break a rule
Re-read it; email
AgenticAI2026@theamse.org for
doubts
AquaCrop-OSPy 3.0.10 lists
Python 3.7 to 3.10; 3.1.0 exists
Install may fail on a
newer interpreter
Test install in Phase 0; keep the
twin in its own pinned worker
LangGraph and LangChain
APIs changed recently
( create_agent  replaced
create_react_agent ; newer
streaming and resume
options)
Code copied from
older tutorials may
not run
Follow current docs; pin versions;
keep one smoke test per graph
LLM key or network fails
during the pitch
Demo stops Rules-only planner, cached
weather, recorded fallback video
EDEN ISS is Antarctic
greenhouse data
Looks unrealistic for
Tamil Nadu
Label it as sensor-shape realism;
use local weather for irrigation
Open-Meteo free tier is non-
commercial only
Blocks commercial
deployment later
Fine for the hackathon; budget a
paid plan in the roadmap
Farmer ID and AgriStack
integration
Out of scope
without access
Roadmap slide only
Dark or light theme
unresolved
Inconsistent
screenshots
Decide in Phase 0
Untitled
Page 24 of 25
3. LangGraph persistence: checkpointers, threads, store.
4. Scaling LangGraph agents: Send  fan-out, reducers, subgraphs (secondary source).
5. AquaCrop-OSPy on PyPI: scope, licence, Python versions, release date.
6. Open-Meteo and its ET0 note: free-tier terms, attribution, hourly and daily ET0.
7. EDEN ISS 2020 telemetry and HydroGrowNet of Batavia: variables, sampling, licences.
8. Hackathon page: dates and the Smart Agriculture problem statement.
Not re-verified in this document: the hackathon Guidelines document's rules and slide
list (read earlier in this project), the OWASP agentic risk names, the 13 existing invariants
and everything about the Solarda repo (taken from its README and handoff notes), and
the savings range in trial studies (taken from the Part 1 research report). Exact import
paths for SqliteSaver  and PostgresSaver , the Open-Meteo ET0 variable name and
HydroGrowNet's sampling interval were not on the pages opened; confirm them during
Phase 0.
Untitled
Page 25 of 25