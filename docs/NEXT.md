# Continuation plan (read this first when the user says "continue")

State as of 2026-10-24: blueprint Phases 0-4 and expansion phases A-F are on `main`, CI green. Details: `docs/DECISIONS.md`
(D1-D14), `docs/AUDIT.md`, `evidence/README.md`. Rules in `CLAUDE.md` still apply (one branch per phase, tests + docs,
replay data never presented as live, LLM proposes and the TypeScript engine decides, never commit weights/secrets/datasets).

## Get the environment running (a fresh VS Code session)
1. `npm install; npm run build`
2. Python 3.11 venvs: `services/{agents,twin,vision}` -> `py -3.11 -m venv .venv` and `pip install -r requirements.lock`
3. Models (GitHub releases, not in git): `scripts/fetch_vision_model.ps1`, `scripts/fetch_sensor_models.ps1`
4. Replay data for retraining only: `python -m app.replay.build_slices` (from `services/agents`); field-eval images land in `data/raw/` (gitignored)
5. Chat needs `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) in the environment. It is a free-tier key: `gemini-3.5-flash` allows 20 requests/day, so
   chat defaults to lite models. Tests use a fake model (`tests/test_chat.py`); don't burn quota in loops.
6. `powershell -File scripts/start_all.ps1`, open http://localhost:3000 -> Agent Console. Stop: `scripts/stop_all.ps1`.
7. Tests: `npm run test:engine`, `npm test -w @terrasub-solarda/api`, and in each service `.venv/Scripts/python -m pytest -q`.

## Next work, in order
1. **Microphone and hands-free voice test** (needs a person speaking): Farm assistant tab -> mic / headphone buttons, in Tamil, Hindi, English.
   Fix what breaks; record in `evidence/phase-e/`. Telugu/Kannada/Malayalam have no browser voice on the dev laptop: check another browser/OS.
2. **Phase F remainder** (audit row first, then wrap, then test + docs):
   - Crop recommender / market mandi prices are hardcoded. Needs a real price source (Tamil Nadu Agmarknet series) before it can change.
   - SMS alerts panels and marketplace are seeded/in-memory: persist marketplace listings (file or SQLite) and wire SMS panels to the audit log.
   - `/api/chat` keyword mock still backs the classic drawer tab; decide whether to retire it.
   - Replace the 32-bit `simpleSha256` in `packages/engine/src/passport.ts` with real SHA-256 (keep the browser-safe build working).
3. **Sensor models**: the pH forecaster did not beat "no change", and the learned detector loses to the rules on pH. Options: more features
   (pump events), HydroGrowNet data, or leave as is. Model anomalies stay warnings, never vetoes.
4. **Vision**: field accuracy is 44-64% (abstains 60-68%). Next step if it matters: fine-tune with PlantWild-style photos (licence CC BY-NC-ND: evaluation
   only unless the licence allows training) or a leaf segmenter; retrain via `services/vision/train/train_colab.ipynb` and publish `vision-v2`.
5. **Open items needing the user**: module owners (`docs/DECISIONS.md` D3), light-theme decision (D1), GitHub repo description,
   Wi-Fi-off clean-clone rehearsal of `docs/DEMO.md` (blueprint Phase 4 gate; `evidence/phase4/offline_check.txt` is only a static check),
   Gemini billing if the chat is demoed heavily.
6. Keep the Benchmark page, `evidence/README.md` and `docs/AUDIT.md` in step with any new number.

## Known quirks
- Windows: avoid `\b` inside normal Python strings written by heredoc (becomes a backspace character); use raw strings or the Write/Edit tools.
- `data/raw/PlantDoc-Dataset` has 5 test files Windows can't create (characters in names); evaluation uses 231 of 236.
- Colab tab reloads when the PC is low on memory; open a fresh tab and re-run if a training run is lost.
