# Security

Solarda lets AI agents propose farm actions (irrigation, nutrient doses, treatments). The security design starts from one rule:
**the language model only proposes; a deterministic safety engine decides; a person with the right role approves anything risky.**

## Reporting a problem
Open a private report under the repository's **Security → Report a vulnerability** tab (GitHub security advisories).
Please do not open a public issue for a vulnerability.

## How the system is protected

| Layer | Protection | Where | Test |
|---|---|---|---|
| Actions | Every agent proposal passes the TypeScript safety engine (13 rules: dose caps, mixing delay, pH direction, implausible readings, rain hold, autonomy tier, E-stop). If the engine is unreachable, every action is vetoed. | `packages/engine/src/agent_safety.ts`, `services/agents/app/api_client.py` | `agent_safety.test.ts`, `test_safety_fixtures.py`, `redteam_cases.test.ts` |
| Prompt injection | The assistant never gives chemical doses; a parallel risk gate escalates dose, jailbreak and role-play requests in six languages. Even a fooled model cannot act: actions still need the engine. | `services/agents/app/chat.py`, `graphs/advisor.py` | `redteam/*.yaml` (30/30 blocked), `test_chat.py`, `/app/redteam` page |
| Sign-in | scrypt password hashes, HMAC-signed `HttpOnly; SameSite=Lax` session cookie, server-side role checks, failed sign-ins limited per email (10 per 15 min, then 429). New accounts are farmers; only an admin grants roles; demo accounts keep their roles. | `weiqou/api/src/auth.ts` | `auth.test.ts` |
| Approvals | Only agronomists and admins can approve; the API stamps who decided and forwards with a shared key the agent runtime requires. | `approvals.ts`, `services/agents/app/main.py` | `approvals.test.ts`, `test_resume_key.py` |
| Agent-only routes | Dispatching actions, writing the audit log and clearing the E-stop through the agent runtime need the shared `X-Solarda-Internal` key, so a browser cannot forge an approval. Anyone may engage the E-stop; only an agronomist or admin may clear it. | `auth.ts` (`requireAgentRuntime`), `routes.ts` | `api_guards.test.ts`, `test_api_client_key.py` |
| Audit log | Append-only and hash-chained; `GET /api/audit/verify` reports the first edited entry. | `agent_routes.ts` | `audit_chain.test.ts` |
| HTTP | No CORS grants (same-origin app), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: same-origin`, `Cache-Control: no-store`, no `X-Powered-By`; JSON errors without stack traces; malformed JSON is a 400. | `weiqou/api/src/app.ts`, agent and vision services | `app_hardening.test.ts`, `test_route_errors.py`, `test_vision.py` |
| Public proxy | The Vercel edge proxy forwards only `/api/`, `/agents/` and `/vision/` paths to the backend; the target is resolved before it is checked, so `..` cannot escape, and encoded slashes or backslashes are refused. | `weiqou/web/api/p.js` | `p.test.mjs` |
| Secrets | Session secret and internal key are generated per machine into gitignored `data/runtime/` with mode 0600 (`make secrets`); API keys live in the gitignored `.env`. No secrets in git. | `Makefile`, `.gitignore` | - |

## Known limits
- **Demo sign-in is on by default.** On a public URL anyone can try the demo farmer, agronomist or admin accounts. Set
  `SOLARDA_DEMO_LOGIN=0` for a real deployment. Demo data is replayed; no real farm is connected.
- **`zod` 3 advisory (GHSA-mrhx-c7xc-m3w5, memory use on oversized collections).** The fix is zod 4, a breaking upgrade
  planned after the finale. Request bodies are capped at 10 MB, which bounds the impact.
- **Rate limits are in memory** and per process; they reset when the API restarts.
- **Deleting only the newest audit entry is not detected** (the chain has no external anchor).
- **Some local demo controls** (`/agents/replay/*`, `POST /api/mode`) need no sign-in. They change the replayed scenario, never what
  the safety engine allows.
