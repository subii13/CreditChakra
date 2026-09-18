# CreditChakra

An NSFDC financing decision-support prototype: matches an applicant's
profile against NSFDC's Scheduled Caste financing schemes, explains
the decision against sourced eligibility rules, estimates repayment,
lets the applicant run "What-If" scenarios, routes them to partners,
and answers questions through a source-grounded AI layer with a fully
deterministic fallback.

See `SECURITY.md` for the threat model and security architecture, and
`DATA_SOURCES.md` for exactly how every scheme figure was sourced and
why some are marked `UNVERIFIED`.

## Architecture

```
frontend/   React + Vite + TypeScript. Supabase anon key only (public by
            design). Talks to the backend with a Bearer token, never
            reads/writes the database directly.
backend/    Express + TypeScript + Prisma. Verifies the Supabase
            session, enforces per-resource ownership, runs the
            eligibility/EMI/what-if engines, talks to Postgres.
```

## Prerequisites

- Node.js 22+
- A Supabase project (free tier is fine) — for `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`/`SUPABASE_PUBLISHABLE_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY`
- `gitleaks` installed locally if you want `npm run security:secrets`
  to run (the pre-commit hook and CI job need it too)

## First-time setup

```bash
npm install               # installs both workspaces
cp backend/.env.example backend/.env      # fill in real values
cp frontend/.env.example frontend/.env    # fill in real values

# Apply the schema, then RLS policies, to your Supabase Postgres:
cd backend
npx prisma migrate deploy   # or `npx prisma db push` for a first-time dev DB
psql "$DATABASE_URL" -f prisma/sql/001_rls_policies.sql
npm run seed                # seeds the 5 NSFDC schemes + demo partners
cd ..
```

Then, before treating this as anything more than a local demo, run the
manual RLS check in `backend/prisma/sql/rls_tests.sql` against two real
test users (see the comment at the top of that file) and confirm every
`expect_*` assertion — RLS being *enabled* is not the same as RLS being
*correct*.

## Running locally

```bash
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

## Verifying before you trust it

```bash
npm run security:check   # secrets scan + dep audit + typecheck + lint + test + build
```

Individually: `npm run typecheck`, `npm run lint`, `npm run test`,
`npm run build`.

## Demo script (SIH, ~2-3 minutes)

1. Home -> **Find my financing path** (or **Try demo profile** to
   pre-fill a synthetic persona — the backend still computes the real
   result).
2. Complete onboarding (goal -> applicant details -> goal-specific
   questions -> financial requirement).
3. Submit -> land on **My Path**: decision type, CreditChakra Match
   score with its methodology, rule-by-rule breakdown, repayment
   estimate, and sourced evidence with verification status badges.
4. **What-If Lab** -> move the sliders (e.g. raise project cost) ->
   **Run simulation** -> see before/after, which rule flipped, and why.
5. **Partners** -> map + list of routing partners with suitability
   scores, clearly labeled demo vs. verified data.
6. **CreditChakra AI** -> click "Why did I get recommended this
   scheme?" and "What changed in my What-If simulation?" -> grounded,
   source-cited answers (works even with no LLM key configured, via
   the deterministic fallback).
7. **Checklist** -> tick off required documents.
8. **Report** -> generate the private, per-user decision summary.

## What this build does and doesn't include

`SECURITY.md`'s "Known limitations" section is the honest list of
what's scaffolded-but-not-exhaustively-verified (RLS policies are
written and correct but not yet run against a live database in this
build environment; rate limiting is in-memory; no bot-protection vendor
is wired in yet). Read it before presenting this as production-ready.
