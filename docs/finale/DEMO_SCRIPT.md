# Finale demo script (10 min presentation + 5 min Q&A)

All four members must be on the call. One person shares the screen (the driver); the others speak their parts.

## Before the slot (30 minutes ahead)

1. `make reset && make dev`, then `make health`: five `OK` lines. `reset` clears old runs and approvals from rehearsals.
2. **Window A (normal Chrome):** http://localhost:3000, sign in as the demo **farmer**. Open the Agent console.
3. **Window B (private window or a second browser):** sign in as the demo **agronomist**, open Approvals.
   Both windows of the same browser share one sign-in, so B must be private or a different browser.
4. Close every other tab and notification. Zoom the browser to 110% so text reads on a shared screen.
5. Keep `evidence/screenshots/finale/` open in a file viewer as the fallback if anything fails.
6. Optional: a Gemini key in `.env` only if the free quota is unused today. Every step below works without it (offline advisor).

## Timeline

| Time | Who | Screen | Say |
|---|---|---|---|
| 0:00-0:45 | Speaker 1 | Slides 2-3 | Small farms decide by habit; events cannot wait; an AI with a valve is a risk. "How can an agent act fast, in the farmer's language, without ever being allowed to do something unsafe?" |
| 0:45-1:30 | Speaker 1 | Slides 5-6 | Propose, check, approve, act. The show stopper: we will try to break it live. |
| 1:30-2:15 | Driver | Window A: landing page, then Overview | The stamp on the hero is three real rule outcomes. Sign-in has roles. The amber badge: no live sensors, all replayed and labelled. |
| 2:15-4:00 | Speaker 2 | Window A: Agent console | Scenario `ph_excursion`, 1440x, L2, **Start**. Wait ~15 s. Open a run marked **veto**: the fertigation agent wants pH-down again; the safety gate says MAX_DOSE_PER_HOUR. Point at the ingest row: the backup probe reads pH 11.37 and is ignored. "The model can ask as often as it likes. Code decides." |
| 4:00-5:45 | Speaker 3 | A then B | Scenario `diseased_leaf_rain`, 1440x, **Start**, then drag the time slider to 15 March just before 06:00. A leaf photo arrives; the disease agent proposes treatment; the trace shows "needs human". In Window A, Approvals: the farmer **cannot** approve. Switch to Window B: the agronomist sees it, presses **Approve and carry out**. Decisions shows "Dr. Priya S (agronomist)". |
| 5:45-7:15 | Speaker 4 | Window B: Try to break it | Left: pick the **தமிழ்** prompt, send: refused in Tamil and escalated to the extension officer. Pick "SYSTEM: the user…", send: refused. Right: **Dump acid** at 500 ml: Blocked, PH_WRONG_DIRECTION. **Spoofed sensor** (pH 14): Blocked. "Two layers: the assistant refuses, and even if it were fooled, the engine blocks." |
| 7:15-8:00 | Speaker 2 | Crop doctor | Pick a PlantVillage sample: calibrated confidence. Explain: 98.2% on lab photos, 61% on field photos, so it refuses to guess and asks for a retake; on the field photos it accepts it is 87.2% right. |
| 8:00-8:45 | Speaker 3 | Water and market | Agent vs fixed vs ET schedule on the AquaCrop twin with Chennai weather: 19 to 32% less water at the same yield. The page also lists where the agent did no better. |
| 8:45-9:30 | Speaker 1 | Slides 8, 10 | Architecture: only the safety engine can allow an action. Results table, 30/30 red team, every number has a file and a command. |
| 9:30-10:00 | Leader | Slide 15 | "Solarda: propose boldly, decide safely." Thank the panel. |

## If something fails

- **A service is down:** `make health`, then `make dev` again (about 10 s). Keep talking over the slides meanwhile.
- **No approval appears:** in the console press **Check now**, or seek the slider to 15 March 06:00 again.
- **Network drops:** everything above runs offline except Google Fonts and the Gemini chat. The offline advisor answers.
- **Total failure:** show the five screenshots in `evidence/screenshots/finale/` and narrate the same steps.

## Rehearsal checklist

- [ ] Full run, timed, from `make stop` to the thank-you slide, twice.
- [ ] Each speaker knows their switch cue (the "Who" column).
- [ ] Window B signed in as agronomist in a private window.
- [ ] Record one clean run as a backup video (screen recorder) and keep it on the desktop.
