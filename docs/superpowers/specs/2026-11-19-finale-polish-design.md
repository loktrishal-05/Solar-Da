# Finale polish: design (round 2)

Date: 2026-11-19. Approved by the team lead in chat after review of the first finale build.

## Intent
The site must work as if it were public: anyone landing on it understands what Solarda is and how to use it, signs in with
one click as a demo role, and sees errors clearly. The landing and login pages must feel immersive (Awwwards-level), not plain.

## Goals
1. Login errors are impossible to miss (error box, invalid field, focus).
2. One-click demo sign-in for Farmer, Agronomist, Admin; each lands on its page (Overview, Approvals, Users). No passwords or
   file paths on the site.
3. New signups are always farmers; an admin promotes users on a new Users page. The last admin cannot be demoted.
4. Every page has a short collapsible "what is this and what can I do" intro; first sign-in shows a role checklist; a public
   `/guide` page explains the concepts with a glossary.
5. API audit: correct status codes and JSON errors everywhere (including malformed JSON and unknown routes), security headers,
   no wildcard CORS; every web fetch shows loading/error/empty states. Findings listed in `docs/AUDIT.md`.
6. Landing: full-screen hands-in-soil video hero (watermark cropped, green grade), a pinned scroll story of one farm event
   (alert, propose, blocked, approved), real product screenshots, results, team.
7. Login/signup right panel: real-time three.js plant scene, gentle sway and mouse parallax, lazy-loaded, static fallback for
   reduced motion or no WebGL.

## Non-goals
Cloud hosting, OTP sign-in, deleting legacy components, new agent features.

## Anti-goals
Sample or example content presented as live (rule 6). Heavy pages that stutter on a screen share: video ≤ 3 MB, three.js only
on login/signup, everything respects `prefers-reduced-motion`.

## Decided
- New dependency: `three` (only new dependency). No animation or tour libraries: IntersectionObserver and CSS.
- `POST /api/auth/demo {role}` signs in the seeded demo account of that role; disabled when `SOLARDA_DEMO_LOGIN=0`.
- `GET /api/admin/users`, `PATCH /api/admin/users/:id {role}` (admin only).
- Videos showing the old "TerraSub" phone app are not used.
