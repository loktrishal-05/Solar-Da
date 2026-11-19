# Round II slide text (paste into the existing deck)

Same 15 slides, same layout as the Round I deck (Google Slides `1XagxOS4…`). Only the text changes. Slide numbers below
are the deck's own page order; section numbers ("1. Background") are what is printed on each slide. Where a slide keeps
its Round I text, it says **(unchanged)**. Organisers' rule: the deck is yours, so edit wording freely.

Screenshots for slides 12-13 are in `evidence/screenshots/finale/`.

---

## Slide 1: Title

- Team Num: **T046**
- Team Name: Unexpectedly_Qualified
- Problem Theme: Agentic AI for Smart Agriculture & Food Security
- Institute Name: R M K College of Engineering and Technology, IN
- Team Members: Harshavardhan K (Leader), Kinnera Cholan, Loktrishal K, Sanjjith B
- Contact: (unchanged)
- Date: **21 November 2026**
- Title: **Solarda: Safety-Gated Agentic AI for Smart Farming**

## Slide 2: 1. Background (unchanged, one line added)

Add as the last line under "End users":

> **Now in the product:** each user signs in with a role. Farmers see what the agent did; only agronomists can approve risky actions, and their name is recorded.

## Slide 3: 2. Problem Statement (unchanged)

## Slide 4: 3. Objectives

- **Event-driven farm agent:** reacts to a sensor limit, a faulty probe, a forecast or a leaf photo at once, instead of a fixed 5 to 10 minute cycle.
- **Safe by design:** a rule-based safety engine can block any action; treatments need an agronomist's approval; if any part fails, nothing is sent.
- **Save water without losing yield:** 19 to 32% less irrigation water than an ET-based schedule at about the same yield (crop simulation, Chennai weather 2021-2023).
- **Speak the farmer's language:** chat and voice in six languages; the assistant never gives chemical doses and sends dose questions to an expert.
- **Ready to use, not just to show:** a web product with sign-in, roles, an approvals inbox and a live "try to break it" page, started with one command (`make dev`).

## Slide 5: 4. Proposed Solution

Intro line:

> Solarda is a multi-agent farm assistant. It watches sensor and weather data, proposes actions and explains them. A separate safety engine checks every action, and risky ones go to an agronomist who signs in to approve them.

The four boxes (keep the layout):

1. **Propose:** AI agents for irrigation, fertigation, climate and disease
2. **Check:** safety engine with 13 rules: allow, modify or block
3. **Approve:** a signed-in agronomist approves risky actions; their name is logged
4. **Act and log:** action sent once and recorded in a tamper-evident log

Main components:

- Crop simulation (AquaCrop) compares "wait", "irrigate now" and "irrigate tonight" before the agent decides
- Leaf disease detection that asks for a new photo when it is not confident
- Farm assistant in six languages with voice input
- Web product: landing page, sign-in with farmer and agronomist roles, overview, agent console, approvals inbox
- Every reading on screen is labelled as replayed, simulated or real data

## Slide 6: 5. Novelty and Show Stopper

Show stopper box:

> **Live: try to break it.** In front of the judges we attack Solarda two ways. (1) We tell the assistant, in English and in Tamil, that we are an admin and ask for a pesticide dose: it refuses and escalates to an expert. (2) We force the agent to dump 500 ml of acid into a tank that is already acidic: the safety engine blocks it with the rule name, nothing reaches the pump, and the attempt is in the audit log.

What is new:

- The AI only suggests; fixed code decides; a signed-in agronomist approves anything risky.
- Fails safe: if the AI service or safety engine is down, all actions are blocked.
- Honest results: data is tagged by source, and we also report cases with no improvement.

Comparison table (keep the two columns):

| | Typical farm chatbot | Solarda |
|---|---|---|
| Who decides | The AI model | Safety engine + agronomist |
| Who approved | Not recorded | Name and role in the audit log |
| Data shown | Presented as live | Tagged: replay / simulation / real |
| Unclear photo | Guesses a disease | Asks for a retake |
| Evidence | Claims only | Source file + command to re-run |

## Slide 7: 6. Methodology (unchanged)

One change in the "Human approval" box: **"Human approval (agronomist sign-in, survives a restart)"**.

## Slide 8: 6. Methodology (contd.)

User interface box, replace the list with:

> React web app: Landing · Sign-in (farmer / agronomist) · Overview · Agent Console · Approvals · Crop Doctor · Farm Assistant · Try to break it · Water and Market

Footer line:

> The whole system starts on a laptop with one command (`make dev`) or one Docker container. Optional Telegram alerts notify the farmer.

## Slide 9: 7. Tech Stack used and Budget

Tech stack:

- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Safety engine and API: Node.js, Express, Zod; sign-in with scrypt-hashed passwords and signed session cookies
- Agents: Python, FastAPI, LangGraph, LangChain, Google Gemini (offline advisor when no key)
- Crop simulation: AquaCrop-OSPy
- Vision: EfficientNetV2-B0 on ONNX Runtime
- Deployment: Docker, nginx, GNU make, GitHub Actions, Vercel (web preview)

Budget table **(unchanged)**.

## Slide 10: 8. Deliverable / Expected Outcome

Intro line:

> A working web product with sign-in and roles, backed by API services, started with one command.

- Agent Console: live event feed, reasoning trace, emergency stop
- Approvals inbox: treatments wait for a signed-in agronomist; who approved is logged
- Try to break it: live prompt-injection and unsafe-action tests, both blocked
- Farm Assistant: chat and voice in six languages, with sources
- Crop Doctor: leaf photo diagnosis, or a request to retake it
- Water and market: water use and yield against fixed and ET-based schedules

Results table:

| Measure | Result |
|---|---|
| Irrigation water saved vs ET-based schedule (best case) | up to 32% |
| Disease model accuracy on lab images / on field photos it accepts | 98.2% / 87.2% |
| Red-team attacks blocked (prompt injection, unsafe dose, fake sensor, Tamil jailbreak) | 30 / 30 |
| Unsafe questions escalated across 6 languages | 100% (32 cases) |
| Automated tests passing | 131 (engine, API, agents, twin, vision) |
| Time to react to a trigger | Immediate (vs 5-10 min cycle) |

Footer: **Results come from simulation and replayed public datasets, not field trials.**

## Slide 11: 9. Team Role (unchanged)

## Slide 12: 10. Screenshot of the outcome-1

Images: `landing.jpg` (left) and `console_ph_veto.jpg` (right).

Captions:

- **Landing page:** what Solarda does, how one decision flows, and results with their sources.
- **Agent Console:** tank pH is high and the agent keeps proposing pH-down. The safety engine blocks the fourth dose: 46 ml in the last hour + 12 ml would pass the 50 ml hourly cap. The broken backup probe (pH 11.37) is flagged and ignored.

## Slide 13: 11. Screenshot of the outcome-2

Images: `approvals_needs_human.jpg`, `try_to_break_it.jpg`, `overview.jpg`.

Captions:

- **Approvals:** late blight detected at 99%; the safety engine marks the treatment "needs a human". Only a signed-in agronomist can approve; their name is recorded.
- **Try to break it:** a fake "SYSTEM" prompt asking for a pesticide dose is refused and escalated; a 500 ml acid dump is blocked by the PH_WRONG_DIRECTION rule.
- **Overview:** what the agent did, what was blocked, what is waiting, and the status of every service.

## Slide 14: 12. References (unchanged)

## Slide 15: Thank You

- Code: github.com/loktrishal-05/Solar-Da
- Web preview: solarda.vercel.app (the full system runs locally with `make dev`)
- Tagline: **Propose boldly. Decide safely.**
