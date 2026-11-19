# Finale product push: design

Date: 2026-11-19. Finale: 21-22 Nov 2026 (online, 10 min presentation + 5 min Q&A, screen-shared from a local run).

## Intent
Make Solarda look and behave like a product rather than a one-page demo, so the judges (scoring pitch, slides, show stoppers,
novelty, USPs, technical strength, demo readiness) see the strong backend through a clean UI. Goal: win.

## Goals
- Landing page, sign-in with roles, and an app with one page per feature behind a sidebar.
- The Agent Console (the show stopper) is one click away, not hidden in a modal.
- Signed-in roles make "a human approves anything risky" real: only an agronomist/admin can approve, and the audit log records who.
- A live "try to break the agent" page: prompt-injection against the assistant and an unsafe action against the safety engine, both blocked on screen.
- One `make` workflow on Linux: setup, run all services, stop, test, health.
- Paste-ready slide text for the existing round-1 deck (same layout), a demo script and Q&A prep.

## Non-goals
- Cloud hosting of the backend (no budget). Vercel stays a front-end-only preview.
- GitHub issues / per-issue branches (user chose to work on `main` directly).
- Vision v2 retraining, new sensor models, real SMS.
- Deleting the ~50 unused legacy components (dead code, not on the demo path; can go later).

## Anti-goals
- Anything replayed or sample shown as live (CLAUDE.md rule 6). Sample-only screens (community, market sample prices) stay labelled.
- The LLM deciding anything (rule 7). Auth changes who may approve, never what the safety engine allows.
- A demo that depends on the network or the 20/day Gemini quota: chat already falls back to the offline advisor without a key.

## Approaches considered
- **A. Restructure the existing Vite React app (chosen).** Add react-router, an app shell and new pages around the components that already talk to the backend. Keeps every working integration.
- B. Rewrite in Next.js. Rejected: rewrites working integrations with 48 h left.
- C. Polish the single long page. Rejected: does not read as a product.
- Auth: local auth in the existing Express API (chosen) vs Supabase/Clerk (rejected: external accounts and network on demo day).

## Decided
- Routes: `/` landing, `/login`, `/signup`, `/app` (overview), `/app/console`, `/app/approvals`, `/app/doctor`, `/app/assistant`,
  `/app/redteam`, `/app/insights` (benchmark + market), `/app/alerts`, `/app/community`, `/app/settings` (product mode).
- Branding: "Solarda" everywhere on the demo path.
- Auth: users in a JSON file under `data/runtime/` (same pattern as the existing store), passwords hashed with `node:crypto` scrypt,
  HMAC-signed httpOnly session cookie. Roles: farmer, agronomist, admin. Demo accounts seeded from a committed seed file with
  demo-only passwords.
- Approvals go through `POST /api/runs/:id/resume` on the Express API: it checks the role, stamps `decided_by` with the user, and
  forwards to the agent runtime with an internal key header. The agent runtime refuses resume without that key when the key is set.
- Show stopper page reuses `/agents/advisor/ask` (or `/agents/chat`) and `/api/safety/check`; no new safety logic.
- Makefile targets: `setup`, `dev` (all five services, logs in `data/runtime/logs`), `stop`, `test`, `health`, `docker`.
- Vercel preview: a clear "preview, backend runs locally" banner instead of broken widgets.

## Left to the builder
Visual design details (follow one token set, one theme), exact page layouts, copy on the landing page.
