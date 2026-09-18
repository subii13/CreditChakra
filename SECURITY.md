# Security

CreditChakra is an NSFDC financing decision-support prototype (built for SIH).
This document covers the threat model, security architecture, and known
limitations of the current build.

## Reporting a vulnerability

Open a private security advisory on the repository, or contact the
maintainer directly. Do not open a public issue with exploit details.

## Architecture

```
Browser (React)
  -> Supabase Auth (email/password; Supabase owns password hashing)
  -> Express API (this repo's backend/)
       - verifies the Supabase access token on every request
       - re-derives the caller's identity server-side; never trusts a
         client-supplied userId
       - enforces per-resource ownership before any read/write
       - talks to Postgres via Prisma using a privileged DB role
  -> Supabase Postgres
       - Row Level Security enabled + FORCE ROW LEVEL SECURITY on every
         table, as a second, independent layer of defense in case a
         client ever gets a direct Supabase connection
```

Two authorization layers exist on purpose:

1. **Application layer (primary, always enforced):** every Express route
   that reads or writes a user-owned record calls `assertOwnedBy` (see
   `backend/src/middleware/ownership.ts`), which throws `NOT_FOUND` (not
   `FORBIDDEN`) when the record doesn't belong to the authenticated
   caller, so a non-owner can't distinguish "doesn't exist" from
   "exists but isn't yours."
2. **Database layer (defense in depth):** `backend/prisma/sql/001_rls_policies.sql`
   enables RLS on every table, default-deny, with owner-only policies
   keyed on `auth.uid() = "userId"`. Public reference tables (schemes,
   rules, sources, partners, checklist definitions) allow anonymous
   `SELECT` only — no client role can write to them.

## Authentication model

- Supabase Auth owns password storage/hashing; this codebase never
  stores a password.
- `backend/src/routes/auth.ts` proxies register/login/logout through
  Supabase so we can layer our own rate limiting (`authLimiter`) and
  generic error messages (no account enumeration) on top.
- The frontend also holds a direct Supabase client (`VITE_SUPABASE_URL`
  + `VITE_SUPABASE_PUBLISHABLE_KEY`, both public by design — see
  Section 2 of the product spec) for session management; the access
  token it gets is sent as a `Bearer` header to the Express API, which
  independently verifies it via `supabase.auth.getUser(token)` using
  the **service role** key (server-only).
- No long-lived token is stored in `localStorage`/`sessionStorage` by
  our own code; Supabase's client manages its own session storage.

## Authorization model

Every protected route: authenticate -> load the record -> verify
`record.userId === req.user.id` -> only then read/write. IDs from the
URL or request body are lookup keys, never permission grants (see
`backend/src/middleware/ownership.ts` and its use across
`backend/src/routes/*.ts`).

Field-level mass-assignment is blocked by allowlist Zod schemas in
`backend/src/validation/schemas.ts` — nothing outside a schema's
declared fields is ever read from a request body. `userId`,
`matchScore`, `decisionType`, `isVerified`, `authorizationStatus`, etc.
are never accepted from a client; they are always computed/derived
server-side.

## Data classification

| Table | Sensitivity | RLS policy |
|---|---|---|
| `applicant_profiles`, `recommendations`, `rule_evaluations`, `simulations`, `emi_calculations`, `ai_conversations`, `ai_messages`, `application_checklists`, `reports`, `partner_interactions` | Private, user-owned | Owner-only (`auth.uid() = "userId"`) |
| `audit_events` | Private, security-sensitive | No client policy at all — service-role only |
| `schemes`, `eligibility_rules`, `scheme_sources`, `checklist_definitions`, `partners`, `partner_schemes` | Public reference data | Public `SELECT`; no client `INSERT`/`UPDATE`/`DELETE` |

Every scheme rule figure carries `source`, `sourceUrl` (via the linked
`scheme_sources` row), `effectiveFrom`, `lastVerified`, and
`verificationStatus` (`VERIFIED` or `UNVERIFIED`) — see
`DATA_SOURCES.md` for the full provenance trail and why several NSFDC
figures ship as `UNVERIFIED` rather than invented.

## Threat model

| Threat | Mitigation | Test |
|---|---|---|
| Credential leakage | No secrets in frontend bundle or Git; `.env` gitignored; gitleaks pre-commit hook + CI job | `scripts/security-secrets.sh`, `.github/workflows/ci.yml` |
| XSS | React auto-escapes text; no `dangerouslySetInnerHTML`; AI output is stripped of markup before storage/render | Manual review; `backend/src/ai/aiService.ts` `sanitizeOutput` |
| CSRF | Bearer-token auth (no ambient cookie to ride on) + Origin/Sec-Fetch-Site validation on state-changing requests | `backend/src/middleware/csrf.ts` |
| SQL/query injection | Prisma parameterized queries only; no raw SQL built from user input | Code review of `backend/src/routes/*.ts` |
| IDOR | `assertOwnedBy` on every resource load; RLS as a second layer | `backend/tests/ownership.test.ts`, `backend/prisma/sql/rls_tests.sql` |
| Mass assignment / field tampering | Zod allowlist schemas; server derives `userId`/decision fields, never accepts them from the client | `backend/tests/validation.test.ts` |
| Session theft | Supabase-managed session tokens; short-lived access tokens sent as Bearer headers, not stored by our code | N/A (relies on Supabase Auth) |
| Brute force / account enumeration | `authLimiter` (rate limit) + generic auth error messages | `backend/src/routes/auth.ts` |
| Bot abuse on high-volume endpoints | Endpoint-specific rate limiters (`aiLimiter`, `simulationLimiter`, `reportLimiter`); `TURNSTILE_SECRET_KEY` env slot reserved for a challenge provider (not wired to a specific vendor in this build) | `backend/src/middleware/rateLimit.ts` |
| SSRF | No endpoint fetches an arbitrary client-supplied URL; scheme source URLs come only from seeded DB metadata | Code review of `backend/src/routes/sources.ts` |
| File upload attacks | No file upload endpoints exist in this build (Section 38 — not needed for the core demo) | N/A |
| Prompt injection | System prompt kept separate from user/context content; user text is passed as data, not concatenated into instructions; the AI never issues DB mutations | `backend/src/ai/aiService.ts`, `backend/src/routes/ai.ts` |
| Data leakage to LLM | Only IDs and non-PII summaries are sent to the LLM context, never `fullName`/`contactInfoEncrypted`/raw financial fields | `backend/src/routes/ai.ts` |
| Privilege escalation | No role/admin concept exposed to clients; service-role key is server-only and used only for auth verification + seeding | `backend/src/lib/supabaseAdmin.ts` |
| Sensitive data exposure at rest | AES-256-GCM for free-text contact info; income/project-cost figures are not treated as needing field-level encryption (they're needed for the rule engine to run, and are protected by RLS + ownership instead) | `backend/tests/crypto.test.ts` |

## Temporary local auth mode

Set `LOCAL_AUTH_MODE=true` (backend) and `VITE_LOCAL_AUTH_MODE=true`
(frontend) to run the whole app — including login-gated pages — with
**no Supabase project at all**. This exists because two things were
unavailable while building this app in a sandboxed environment: a real
Supabase cloud project (needs your account) and Supabase's local
Docker stack (this sandbox's network policy blocks the image pulls).
It is explicitly a throwaway, requested and scoped as temporary, not a
second production auth system:

- **Backend** (`backend/src/lib/localAuth.ts`): email/password stored
  in a dedicated `local_auth_users` table, hashed with Node's built-in
  `scrypt` (not Argon2id — deliberately avoiding a native-compiled
  dependency for a path meant to be deleted). Sessions are a small
  HMAC-signed token (`SESSION_SECRET`), 24h expiry, no refresh flow.
  `backend/src/middleware/auth.ts` and `backend/src/routes/auth.ts`
  each have one `if (env.LOCAL_AUTH_MODE)` branch; everything else
  (ownership checks, RLS, rate limiting, validation) is unchanged and
  still applies on top.
- **Frontend** (`frontend/src/lib/authSession.ts`): the access token
  is kept in `sessionStorage` under a clearly-named key, instead of
  Supabase's own session handling — a deliberate, temporary exception
  to the "no long-lived tokens in browser storage" rule (Section
  16/101), scoped only to this shim.
- **Database:** `local_auth_users` has RLS enabled with zero client
  policies (same treatment as `audit_events`) — no anon/authenticated
  request can read a password hash through PostgREST, whether or not
  the shim is active.

**To remove it** once a real Supabase project is wired in: delete
`backend/src/lib/localAuth.ts` and `frontend/src/lib/authSession.ts`'s
local branch, remove the `LOCAL_AUTH_MODE`/`VITE_LOCAL_AUTH_MODE`
branches in `backend/src/middleware/auth.ts`,
`backend/src/routes/auth.ts`, `frontend/src/context/AuthContext.tsx`,
and `frontend/src/lib/apiClient.ts`, drop the `LocalAuthUser` model and
its RLS policy block, and delete the env vars.

## Known limitations of this build

This is an SIH prototype, not a production deployment. Being explicit
about what has NOT been done, rather than overclaiming:

1. **No live Supabase project was provisioned in this build
   environment.** `backend/prisma/sql/001_rls_policies.sql` and
   `backend/prisma/sql/rls_tests.sql` are correct and ready to apply,
   but they have not been run against a real database as part of this
   build — do that before any real deployment (see README's setup
   steps), then run `rls_tests.sql` and confirm every `expect_*`
   assertion.
2. **Rate limiting uses the in-memory store** (`express-rate-limit`'s
   default). Fine for a single-instance demo; a multi-instance
   production deployment needs a shared store (Redis/Upstash) or
   limits reset per-instance.
3. **No bot-protection/CAPTCHA vendor is wired in** — the
   `TURNSTILE_SECRET_KEY` env slot exists but nothing calls it yet.
   Rate limiting is the current abuse control on auth/AI endpoints.
4. **Several NSFDC scheme figures ship as `UNVERIFIED`** because this
   build environment's network policy blocked direct requests to
   `nsfdc.nic.in`/`myscheme.gov.in`. See `DATA_SOURCES.md`. Confirm
   these against the primary source before treating them as official.
5. **CI (`.github/workflows/ci.yml`) has not been run on GitHub** as
   part of this build — it's configured (secret scan, audit,
   typecheck, lint, test, build) but its first real run should be
   watched.
6. **No dedicated `AiConversation`/report-download signed-URL
   mechanism** — reports are served directly through the authenticated,
   ownership-checked `GET /api/reports/:id` route rather than a
   separate object-storage layer, since there's no file to store (the
   report is a JSON payload). This satisfies "no public/guessable
   report URLs" without needing signed URLs.
