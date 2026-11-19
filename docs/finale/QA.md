# Likely judge questions (5 minutes of Q&A)

Short answers. Point at the repo or a screen when you can. If you do not know, say what you would measure to find out.

**Is this running on a real farm?**
No. There are no live sensors yet. Readings are replayed from public datasets (EDEN ISS greenhouse, HydroGrowNet) and an AquaCrop crop simulation with real Chennai weather. Every value on screen says where it came from. A pilot needs about ₹15,000 of sensors per acre.

**What stops the language model from doing something dangerous?**
It cannot act. It only proposes. Every proposal goes to the safety engine, plain TypeScript code with 13 rules (dose caps, mixing delay, rain hold, implausible readings, E-stop, autonomy tier). The model cannot talk to that code. Treatments always need an agronomist. If the engine is unreachable, every action is blocked. We show this live on the "Try to break it" page.

**Why not just put the safety rules in the prompt?**
A prompt can be overridden by another prompt. Our red team does exactly that ("ignore previous instructions", fake SYSTEM messages, Tamil jailbreaks). Rules in code cannot be talked out of. We tested 30 attacks: 30 blocked.

**What makes this agentic and not just automation?**
It decides when to run (event triggers with cooldowns), picks which specialists are needed, runs them in parallel, merges their proposals, simulates options in the crop twin before choosing, verifies the effect afterwards and retries or escalates. The human sets the autonomy level: advise, propose or act within the safe envelope.

**Field accuracy is 61%. Isn't that poor?**
Field photos are much harder than lab photos, and we report that honestly. That is why the model abstains: at our threshold it refuses about 60% of field photos and asks for a retake, and it is 87.2% right on the ones it accepts. A wrong confident answer is worse than "please retake". Also, a diagnosis never triggers a treatment on its own; an agronomist approves it.

**How did you get 19 to 32% water savings?**
In the AquaCrop crop simulation with Chennai weather for 2021-2023, against a rule-based ET (evapotranspiration) controller, at about the same yield. It is simulation, not a field trial. The Water page lists the cases where the agent did no better. Re-run: `bench/run_bench.py`.

**What happens without internet in a village?**
The agents, safety engine, vision model and offline advisor all run on one laptop or a small box. Only the Gemini chat and live weather need the internet; without them the offline advisor answers from approved sources.

**How does a farmer who cannot read English use it?**
Voice and text in Tamil, Hindi, Telugu, Kannada, Malayalam and English. Alerts go by SMS (demo outbox) or Telegram. In testing, 100% of unsafe questions across the six languages were escalated, with no false refusals on the 32 safe ones.

**Who is liable if a treatment goes wrong?**
The agent never chooses a product or a dose. It proposes "treat for late blight" with sources; a named agronomist approves and decides the product. Their name and the time are in the tamper-evident audit log.

**How is sign-in secured?**
Passwords are hashed with scrypt; sessions are HMAC-signed, httpOnly cookies; roles are checked on the server. Only the agent runtime (with a shared key) can dispatch actions or write the audit log, so a browser cannot forge an approval. The API sends security headers and no CORS, and every error is a clear JSON message. A real deployment would add phone OTP sign-in.

**Can the audit log be edited after the fact?**
Each entry stores a hash of the one before it, so editing an earlier entry breaks the chain; `GET /api/audit/verify` reports where. It is tested (`audit_chain.test.ts`).

**Can anyone make themselves an agronomist?**
No. Every signup starts as a farmer. Only an admin can give the agronomist role, on the Users page, and the last admin cannot be removed. The one-click demo buttons sign into three seeded demo accounts and can be switched off with one setting (`SOLARDA_DEMO_LOGIN=0`).

**How would this scale or make money?**
Pilot cost is about ₹1,500 to 4,200 per month plus sensors. Revenue options: a per-acre subscription for farmer groups (FPOs), and agronomist time billed per approval. The safety engine and audit log are what make it acceptable to an FPO or an insurer.

**What did each team member do?**
Answer from slide 11 (team roles). Each person names one thing they built.

**What is next?**
A 1-acre pilot with real sensors, phone OTP sign-in, a better field leaf model (more field photos, leaf segmentation), and connecting real mandi prices with a data.gov.in key.
