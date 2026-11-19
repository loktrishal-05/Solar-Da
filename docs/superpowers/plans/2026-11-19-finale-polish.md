# Finale Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear errors, one-click demo roles with an admin Users page, built-in explanations, an audited API, and an immersive landing and login.

**Architecture:** Extend `weiqou/api/src/auth.ts` (demo login, admin routes, farmer-only signup) and `app.ts` (headers, JSON 404/errors).
Web: new `PageIntro` + `/guide`, `pages/Admin.tsx`, rebuilt `Landing.tsx`, `shell/PlantScene.tsx` (three.js, lazy).

**Tech Stack:** React 18, Tailwind, three.js, Express + node:test, FastAPI.

**Spec:** `docs/superpowers/specs/2026-11-19-finale-polish-design.md`

## Global Constraints
- Branch `finale`, small commits, push after each task (PR #3).
- Only new dependency: `three` (+ `@types/three` dev).
- No passwords, seed paths or internal file names in any page text.
- Rule 6: example/sample content labelled; nothing replayed shown as live.
- `prefers-reduced-motion`: no autoplay video, no animation loop.

## Review Focus
- Demo login with `SOLARDA_DEMO_LOGIN=0` → 404, no session. Test in Task 1.
- Admin demotes themself when they are the last admin → 409. Test in Task 2.
- Malformed JSON body to any `/api` route → 400 JSON, not an HTML stack page. Test in Task 3.
- WebGL unavailable → login panel shows the static fallback, page still works. Checked in Task 6.
- Phone width (390 px) landing: video hero and pinned story without horizontal scroll. Checked in Task 5.

---

### Task 1: Login error UX and one-click demo roles
**Files:** `weiqou/api/src/auth.ts`, `auth.test.ts`, `weiqou/web/src/auth.tsx`, `pages/Auth.tsx`
- API: `POST /api/auth/demo {role: 'farmer'|'agronomist'|'admin'}` → 200 `{user}` + cookie for the first seeded user (by seed email) with that role; 400 bad role; 404 when `SOLARDA_DEMO_LOGIN === '0'`. Signup ignores any `role` and creates a farmer.
- Tests: demo farmer/agronomist/admin each return that role and a working cookie; bad role 400; disabled → 404; signup with `role: 'agronomist'` → 201 role farmer.
- Web: `useAuth().demo(role)`; Login shows three role cards (what each can do) that sign in and navigate to `/app`, `/app/approvals`, `/app/admin`. Error box with icon, `aria-invalid` + red border on fields, focus password, clear it. Signup loses the role select. Remove "password in …" text.

### Task 2: Admin Users page
**Files:** `auth.ts`, `auth.test.ts`, `web/src/pages/Admin.tsx`, `App.tsx`, `shell/AppShell.tsx`
- `GET /api/admin/users` → `{users: PublicUser[]}` (admin, else 401/403). `PATCH /api/admin/users/:id {role}` → `{user}`; 404 unknown id; 400 bad role; 409 when it would leave no admin.
- Tests for each status. Web page: table of users, role select per row, saved toast/error; sidebar item "Users" for admins only.

### Task 3: API audit (headers, JSON errors, CORS)
**Files:** `weiqou/api/src/app.ts`, `weiqou/api/src/app_hardening.test.ts`, `routes.ts`/`agent_routes.ts` as found, `docs/AUDIT.md`
- `x-powered-by` off; headers `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Cache-Control: no-store` on `/api`; remove wildcard `cors()`; unknown `/api/*` → 404 JSON; body parse error → 400 JSON; uncaught → 500 JSON without stack.
- Tests for each. Then read every route in `routes.ts`, `agent_routes.ts`, `services/agents/app/main.py` and every `fetch(` in `weiqou/web/src` (demo path); fix wrong status codes / missing error states; list findings in AUDIT.md.

### Task 4: Explanations (page intros, welcome checklist, guide)
**Files:** `web/src/help.tsx` (intro texts + `PageIntro`), `pages/Guide.tsx`, `pages/Overview.tsx`, `App.tsx`, `shell/AppShell.tsx`, Landing/footer links
- `PageIntro {page}`: what this page is, what you can do, one tip; collapsible, remembered per page (localStorage, try/catch). Shown on every app page.
- Overview: role checklist on first visit (dismissable).
- `/guide` (public): how it works, roles, autonomy L0-L2, verdicts, replayed data, scenarios, glossary. Linked from landing nav, login, shell.

### Task 5: Immersive landing
**Files:** `web/src/pages/Landing.tsx`, `web/public/media/hero-soil.mp4` + poster, `web/public/media/screens/*.jpg`
- Full-screen video hero (scaled to crop the corner mark, green gradient overlay, poster), headline + CTAs; pinned scroll story of 4 stages; product screenshots strip; results; team; footer. Check 1440 and 390 widths, reduced motion.

### Task 6: 3D plant scene on login/signup
**Files:** `web/package.json` (`three`), `web/src/shell/PlantScene.tsx`, `pages/Auth.tsx`
- Lazy `import('three')`; procedural stems and leaves, sway, mouse parallax, devicePixelRatio ≤ 2, stops when hidden; fallback SVG when no WebGL or reduced motion. Bundle: three only in the auth chunk.

### Task 7: Verify and docs
- `make test` green, web build, browser pass of every page as each role, DEMO_SCRIPT/SLIDES/README/NEXT updated, push.
