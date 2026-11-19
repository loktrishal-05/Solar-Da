# Finale Product Push Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the one-page Solarda demo into a product (landing, sign-in with roles, sidebar app, live red-team page) that runs locally with `make`.

**Architecture:** Keep the existing Vite React app and Express API. Add a ~30-line pushState router, an auth module in the API
(JSON-file users, scrypt, HMAC cookie), and an API approval gateway that stamps the approver and forwards to the agent runtime
with an internal key. New pages wrap the existing working components.

**Tech Stack:** React 18 + Vite + Tailwind, Express + zod + `node:test`, FastAPI + pytest, GNU make, uv (Python 3.11 venvs).

**Spec:** `docs/superpowers/specs/2026-11-19-finale-product-design.md`

## Global Constraints
- Work on `main`, small commits, push after each task (user's choice for this push).
- No new npm/pip dependencies unless a task names one. Router is hand-rolled; cookies parsed by hand.
- Every replayed/sample value on screen keeps a visible source label (CLAUDE.md rule 6). Never "Live" for replayed data.
- The LLM only proposes; roles only change who may approve, never the safety verdict (rule 7).
- Branding on the demo path: "Solarda". Product-mode toggle (TerraSub/Solar-Da) moves to Settings.
- Never commit secrets: session secret and internal key are generated into gitignored `data/runtime/`.
- Each task: code + test (or build + browser check for pure UI) + docs line (README/NEXT/AUDIT as named).

## Review Focus
- API restarted mid-demo: sessions must survive (secret persisted in `data/runtime/.session_secret`). Test in Task 2.
- Agent runtime started without the internal key (old scripts, Docker): resume must still work (key check only when env set). Test in Task 3.
- Backend down (Vercel preview): every page renders an explicit "backend runs locally" state, never a crash or blank. Checked in Task 8.
- Deep link reload (`/app/console`) on Vite dev, nginx and Vercel returns the SPA. Checked in Task 4 (vercel.json) and Task 1 (nginx already has `try_files`).
- Signup with existing email in different case (`A@x.com` vs `a@x.com`): 409. Test in Task 2.

---

### Task 1: Makefile for Linux setup and run

**Files:**
- Create: `Makefile`
- Modify: `README.md` (Quick start: `make setup && make dev`), `docs/NEXT.md` (environment section points to make)

**Interfaces:**
- Produces: `make setup` (npm ci, npm run build, `uv venv --python 3.11 services/<s>/.venv` + `uv pip install -r requirements.lock` for agents/twin/vision, `python deploy/fetch_models.py` if models missing, creates `data/runtime/{.session_secret,.internal_key}` with `openssl rand -hex 32` if absent);
  `make dev` (starts api:3001, agents:8000, twin:8100, vision:8200, web:3000 in background, logs `data/runtime/logs/<svc>.log`, pids `data/runtime/pids/<svc>.pid`, exports `.env` + `SESSION_SECRET` + `SOLARDA_INTERNAL_KEY` from the files), `make stop`, `make health` (curl the four health URLs, prints OK/DOWN), `make test` (engine, api, three pytest suites), `make docker` (build + run :7860).

- [ ] Step 1: Check `deploy/fetch_models.py` target paths match the local layout (it was written for the container); add a `--dest` arg only if they differ.
- [ ] Step 2: Write the Makefile.
- [ ] Step 3: Run `make setup && make dev && sleep 10 && make health`. Expected: four `OK` lines. Open http://localhost:3000, Agent Console, start `heatwave`, see runs.
- [ ] Step 4: `make test`. Expected: all suites pass (record counts).
- [ ] Step 5: Docs lines, commit `build: Makefile for one-command Linux setup and run`, push.

### Task 2: Auth API (users, sessions, roles)

**Files:**
- Create: `weiqou/api/src/auth.ts`, `weiqou/api/src/auth.test.ts`, `weiqou/api/seed/users.json`
- Modify: `weiqou/api/src/app.ts` (mount `authRouter` on `/api`)

**Interfaces:**
- Produces:
  - `type Role = 'farmer' | 'agronomist' | 'admin'`; `type PublicUser = { id: string; name: string; email: string; role: Role }`
  - `authRouter`: `POST /api/auth/signup {name,email,password,role?}` → 201 `{user}` + cookie (role ∈ farmer|agronomist, default farmer; admin only via seed); `POST /api/auth/login {email,password}` → `{user}` + cookie; `POST /api/auth/logout` → 204, clears cookie; `GET /api/auth/me` → `{user}` or 401.
  - `currentUser(req): PublicUser | null`; `requireRole(...roles: Role[]): RequestHandler` (401 if no session, 403 if wrong role).
  - Cookie `solarda_session=<base64url(json {uid, exp})>.<hex hmac-sha256>`, httpOnly, SameSite=Lax, Path=/, 7 days.
  - Users file `${SOLARDA_RUNTIME_DIR ?? data/runtime}/users.json`; on first load, seeded from `seed/users.json` (demo-only passwords, plain in seed, hashed on load). Secret: `SESSION_SECRET` env, else read/create `<runtime>/.session_secret`.
  - Password hash `scrypt$<salt hex>$<hash hex>` via `node:crypto` `scryptSync`, compare with `timingSafeEqual`. Emails stored lowercased. Password min 8 chars.
- Seed accounts: `farmer@solarda.demo` (farmer, "Murugan K"), `agronomist@solarda.demo` (agronomist, "Dr. Priya S"), `admin@solarda.demo` (admin). Demo password lives only in the seed file.

- [ ] Step 1: Write `auth.test.ts` (pattern of `disease_routes.test.ts`: temp `SOLARDA_RUNTIME_DIR`, import app, listen on 0):
  - signup → 201, `me` with the cookie returns the user with role farmer
  - signup same email in upper case → 409
  - signup `role: 'admin'` → 400
  - login wrong password → 401; login seeded agronomist → 200 role agronomist
  - cookie with flipped last hex char → `me` 401
  - users file contains no plain password (`!raw.includes(password)`)
  - new app instance in same runtime dir accepts the old cookie (secret persisted)
- [ ] Step 2: `npm test -w @terrasub-solarda/api` → new tests FAIL.
- [ ] Step 3: Implement `auth.ts`, mount in `app.ts`.
- [ ] Step 4: Tests PASS, existing API tests still pass.
- [ ] Step 5: `docs/AUDIT.md` row "Auth: real (local JSON store, demo seed)". Commit `feat(api): local auth with roles`, push.

### Task 3: Role-gated approval gateway

**Files:**
- Create: `weiqou/api/src/approvals.ts`, `weiqou/api/src/approvals.test.ts`, `services/agents/tests/test_resume_key.py`
- Modify: `weiqou/api/src/app.ts`, `services/agents/app/main.py:172` (`run_resume`)

**Interfaces:**
- Consumes: `requireRole`, `currentUser` (Task 2).
- Produces: `POST /api/runs/:id/resume {approvals: [{proposal_id, decision: 'approve'|'reject', ts}]}` → requires agronomist|admin; sets each `decided_by = "<name> (<role>)"` (client value ignored); forwards to `${SOLARDA_AGENTS ?? 'http://127.0.0.1:8000'}/runs/:id/resume` with header `X-Solarda-Internal: <SOLARDA_INTERNAL_KEY>`; relays status and body. Also appends audit `{type:'approval', run_id, by, approvals}`.
- Agent runtime: if env `SOLARDA_INTERNAL_KEY` is set and header differs → 403 `{"detail":"approvals go through the API"}`; unset → unchanged behaviour.

- [ ] Step 1: `approvals.test.ts` with a fake agents server capturing the forwarded request: no cookie → 401; farmer → 403 and fake not called; agronomist → 200, forwarded body has `decided_by: "Dr. Priya S (agronomist)"` even when client sent `"hacker"`, header equals env key; fake returns 409 → API returns 409.
- [ ] Step 2: `test_resume_key.py`: with key set, POST resume without header → 403; with header → not 403. Without key set → not 403.
- [ ] Step 3: Both FAIL; implement; both PASS (`make test`).
- [ ] Step 4: AUDIT row update, commit `feat: approvals require an agronomist and record who approved`, push.

### Task 4: Router, auth context, design kit, app shell

**Files:**
- Create: `weiqou/web/src/router.tsx`, `weiqou/web/src/auth.tsx`, `weiqou/web/src/ui.tsx`, `weiqou/web/src/shell/AppShell.tsx`, `weiqou/web/vercel.json`
- Modify: `weiqou/web/src/App.tsx` (becomes the route table), `weiqou/web/tailwind.config.js` (brand tokens), `weiqou/web/index.html` (title "Solarda")

**Interfaces:**
- `router.tsx`: `usePath(): string`, `navigate(to: string): void` (pushState + dispatch popstate), `<Link to>` (anchor, preventDefault on plain left click).
- `auth.tsx`: `<AuthProvider>`; `useAuth(): { user: PublicUser | null; loading: boolean; login(email, password): Promise<void>; signup(input): Promise<void>; logout(): Promise<void> }`; `<RequireAuth>` redirects to `/login?next=<path>`.
- `ui.tsx`: `Button` (variant primary|secondary|ghost|danger), `Card`, `PageHeader {title, subtitle, actions?}`, `Stat {label, value, hint?}`, `SourceBadge {source: 'replay'|'sim'|'live'|'sample'}` (amber/blue/green/grey, text always visible), `EmptyState {title, body}`.
- `AppShell`: left sidebar (Overview, Agent Console, Approvals with pending count, Crop Doctor, Assistant, Red Team, Insights, Alerts, Community, Settings), top bar with E-STOP (moved from App), user menu (name, role chip, sign out), assistant drawer button.
- Routes table in `App.tsx`: `/`, `/login`, `/signup`, `/app`, `/app/console`, `/app/approvals`, `/app/doctor`, `/app/assistant`, `/app/redteam`, `/app/insights`, `/app/alerts`, `/app/community`, `/app/settings`; unknown → 404 card with link home. Pages not yet built in this task render the existing component (AgentConsole, LightCropDoctorSection, FarmChat+AdvisorPanel, BenchmarkPage+LightMarketSection, LightSmsAlertsSection, LightCommunitySection) inside `PageHeader`.
- `vercel.json`: rewrite all to `/index.html`.

- [ ] Step 1: Implement; `npm run build -w @terrasub-solarda/web` passes.
- [ ] Step 2: Browser check (make dev): each sidebar link loads, reload on `/app/console` works, signed-out `/app` → `/login`.
- [ ] Step 3: AgentConsole `decide()` posts to `/api/runs/:id/resume` (Task 3); approve/reject buttons shown only for agronomist|admin, otherwise "Sign in as an agronomist to approve".
- [ ] Step 4: Commit `feat(web): routed app shell with sign-in`, push.

### Task 5: Login, signup, and landing page

**Files:**
- Create: `weiqou/web/src/pages/Landing.tsx`, `weiqou/web/src/pages/Login.tsx`, `weiqou/web/src/pages/Signup.tsx`

- Landing sections: nav (Solarda, Sign in, Get started); hero "AI proposes. Code decides. Farmers stay in control." with an animated propose → check → approve → act strip showing one veto; problem (3 cards from deck slide 2-3); how it works (4 steps); show stoppers (safety veto, role handoff, red team, abstaining vision, 6 languages); results (up to 32% water saved vs ET schedule in simulation, 98.2% lab / 61% field vision with abstain, 30/30 red-team, immediate trigger) each with "simulation"/"replayed" label; architecture strip; team (4 names); footer with honesty note.
- Login: email + password, "Use demo farmer" / "Use demo agronomist" buttons that fill the email only; error text from API. Signup: name, email, password, role select (farmer|agronomist).
- Load `frontend-design:frontend-design` skill before writing.

- [ ] Step 1: Implement; build passes.
- [ ] Step 2: Browser: landing at 1440 and 390 widths, no horizontal scroll; login as farmer and agronomist; signup new user lands in `/app`.
- [ ] Step 3: Commit `feat(web): landing, login and signup`, push.

### Task 6: Overview and Approvals pages (real data only)

**Files:**
- Create: `weiqou/web/src/pages/Overview.tsx`, `weiqou/web/src/pages/Approvals.tsx`

- Overview: greeting with role; service health tiles (`/api/health`, `/agents/health`, `/vision/health`); pending approvals count (`/agents/runs` status `awaiting_approval`); last 5 runs with verdict; last 5 safety vetoes (`/api/audit`); replay clock (`/agents/replay/state`) with `SourceBadge source="replay"`. Poll every 5 s.
- Approvals: list of pending approval requests (same source as AgentConsole), each action with safety reason; approve/reject through `/api/runs/:id/resume`; history of decided approvals from `/api/audit` type `approval` showing who decided. This is the agronomist's screen for the two-window handoff demo.

- [ ] Step 1: Implement; build passes.
- [ ] Step 2: Browser, two windows: farmer runs `disease` scenario at L1 in Console; agronomist window shows it in Approvals within 5 s; approve; Console shows dispatch; Approvals history shows "Dr. Priya S (agronomist)".
- [ ] Step 3: Commit `feat(web): overview and approvals inbox`, push.

### Task 7: "Try to break the agent" red-team page

**Files:**
- Create: `packages/contracts/src/redteam_cases.ts` (export from `index.ts`), `weiqou/web/src/pages/RedTeam.tsx`, `weiqou/api/src/redteam_cases.test.ts`

**Interfaces:**
- `RED_TEAM_ACTIONS: Array<{ id: string; title: string; attack: string; request: SafetyRequest; expect: 'veto' | 'needs_human' }>` with at least: pH-down 500 ml when pH 5.3 (veto), treatment at `auto_in_envelope` (needs_human), spoofed pH 14 reading (veto, invalid telemetry), irrigate 120 min with rain forecast 25 mm (veto or modify, assert actual engine verdict in the test and copy it), any action under `advise` tier (veto).
- `RED_TEAM_PROMPTS: Array<{ id: string; lang: string; text: string }>`: 4 prompts from `redteam/advisor.yaml` (English goal-hijack, fake SYSTEM, developer mode, one Tamil).
- Page: left column "Attack the language model" (pick or type a prompt → `POST /agents/advisor/ask {text}` → show answer, `escalated`, risk); right column "Attack the actuators" (pick a case, editable ml/minutes → `POST /api/safety/check` → verdict, invariant, reason, big BLOCKED/NEEDS HUMAN stamp). Footer: "30/30 red-team cases pass (redteam/*.yaml)".

- [ ] Step 1: `redteam_cases.test.ts`: every `RED_TEAM_ACTIONS` request posted to `/api/safety/check` returns the `expect`ed outcome (veto → `verdict==='veto'`; needs_human → `needs_human===true`). FAIL first.
- [ ] Step 2: Implement cases; test PASS. Build page; browser check with advisor running.
- [ ] Step 3: Commit `feat: live red-team page`, push.

### Task 8: Honesty pass, preview banner, docs

**Files:**
- Modify: `LightCommunitySection.tsx`, `LightMarketSection.tsx`, `LightSmsAlertsSection.tsx` (visible `SourceBadge source="sample"`, "Agmarknet Feed Active"/"(Live)" text → "Sample prices"), `AppShell.tsx` (banner when `/api/health` fails: "Preview: the agents run on the local stack (make dev)"), `docs/AUDIT.md`, `docs/NEXT.md`, `README.md`, `docs/DEMO.md`.

- [ ] Step 1: Grep the demo-path components for "Live", "Active", "Real-time", "Online" next to sample data; relabel. Browser check.
- [ ] Step 2: `npm run build`, stop backend, browse every page: banner shown, no crash.
- [ ] Step 3: Docs: AUDIT rows for new pages, NEXT.md state + make workflow, README screenshots refreshed (Task 9 makes them), DEMO.md new flow. Commit, push.

### Task 9: Finale pack (slides text, demo script, Q&A)

**Files:**
- Create: `docs/finale/SLIDES.md` (paste-ready text per existing slide 1-13, same layout; Team Num T046), `docs/finale/DEMO_SCRIPT.md` (10-minute timed walkthrough, who speaks when, fallback if a service fails), `docs/finale/QA.md` (likely judge questions with short answers), new screenshots in `evidence/screenshots/`.

- [ ] Step 1: Take screenshots of landing, overview, console trace, approvals handoff, red-team veto (Chrome).
- [ ] Step 2: Write the three docs from the real build and evidence numbers (`evidence/README.md`).
- [ ] Step 3: Full rehearsal run of DEMO_SCRIPT with `make dev` from a clean `make stop`. Commit, push.
