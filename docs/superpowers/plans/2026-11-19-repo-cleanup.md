# Repository Cleanup and Quality Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A lean, documented, licensed repository that scores well on code quality, security, testing, efficiency, accessibility and problem alignment.

**Decisions (team lead, 2026-11-19):** MIT licence; remove the never-working TF.js browser fallback; remove `docs/deck/build_deck.js`
and `docs/terrasub-solarda-master-prompt.md` but keep `CLAUDE.md` and `docs/superpowers/`; keep the `weiqou/` folder name until after
the finale (Vercel root directory). Branch `cleanup` from merged `main`, one PR.

## Global Constraints
- Nothing on the demo path changes behaviour except removing the dead TF.js fallback. `make test` green after every task.
- Removals are listed in `docs/AUDIT.md` (CLAUDE.md rule 4) and recorded as decision D19 (overrides rule 5 for dead code, by request).
- No new runtime dependencies. Dev-only: eslint + typescript-eslint + eslint-plugin-react-hooks; ruff via `uvx`/pip in CI only.

## Review Focus
- Crop doctor with the vision service down: clear "not running" state, no crash, no TF.js request.
- Every page still renders after lazy-loading (direct deep link and in-app navigation).
- Vercel proxy only forwards `api/`, `agents/`, `vision/` paths.
- Lighthouse accessibility ≥ 95 on landing, login, guide, overview, console, approvals.
- Docker build still works (removed files not referenced by Dockerfile/.dockerignore/CI).

### Task 1: Remove dead code, media, TF.js path, unused dependencies
Iteratively delete web components/hooks no live file imports; old media used only by them; `public/models/`; TF.js code in
`useDiseaseDetector.ts`; `start_dev.bat`, `start_public.bat`, `setup_and_test.bat`, `scripts/convert_hf_to_tfjs.py`,
`scripts/download_tfjs_model.ps1`; `prisma/`; deps `framer-motion`, `@tensorflow/tfjs`, `@prisma/client`, `prisma`, `cors`, `ws`,
`@google/generative-ai` if unused. Verify: web build + `make test`; bundle size before/after.

### Task 2: Tidy files and docs
`sample images/` → `services/vision/tests/fixtures/field_leaf_{1..5}.jpeg` (tests, .dockerignore, docs); remove deck script, master
prompt, superseded docs; `.gitignore` covers runtime/build output.

### Task 3: Lint (code quality)
ESLint flat config for `weiqou/*` and `packages/*`, Ruff for `services/*` and `bench/`; fix findings; `make lint`; CI step.

### Task 4: Security
`SECURITY.md`; Vercel proxy path allow-list + test; `npm audit fix` (non-breaking); review remaining findings.

### Task 5: Efficiency
Route-level `React.lazy` for app pages, guide, auth; measure main chunk before/after.

### Task 6: Accessibility
Lighthouse a11y on the six pages; fix every failing audit (labels, contrast, landmarks, names).

### Task 7: Docs, licence, CI
`LICENSE` (MIT), `THIRD_PARTY_NOTICES.md` (datasets, models, fonts, footage), README rewrite (problem → solution → evidence per
criterion → quick start → architecture → tests → security → accessibility → licence → team), CI builds and lints the web app.
