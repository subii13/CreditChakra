# Scheme data provenance

This document is the source-of-truth trail for every NSFDC scheme
figure seeded into the database (`backend/prisma/seed.ts`). It exists
because the product spec (Section 43) explicitly forbids seeding an
unverified figure as if it were confirmed official data.

## Build-environment constraint

This build's sandboxed network egress **blocks direct requests to
government domains** (`nsfdc.nic.in`, `myscheme.gov.in` both returned
`EGRESS_BLOCKED` when fetched directly during this build). This means:

- No figure below was confirmed by directly reading the primary NSFDC
  page in this build.
- Every figure was instead cross-checked against **multiple
  independent secondary sources** (financial aggregators, NGO/scheme
  directories) that themselves cite NSFDC/myScheme as their source.
- `verificationStatus: VERIFIED` is used only where several
  independent secondary sources converged tightly and consistently
  cited NSFDC/myScheme — not because a primary source was read
  directly.
- `verificationStatus: UNVERIFIED` is used wherever sources conflicted,
  a figure could not be scheme-specifically confirmed (vs. inferred
  from NSFDC's general mandate), or a scheme name was found to be
  ambiguous/conflated with a similarly-named scheme from a different
  agency.

**Before any real deployment:** re-fetch each `sourceUrl` below
directly (from an environment that can reach the government domains),
confirm the figures, and flip `verificationStatus` to `VERIFIED` (or
correct the figure) via a migration/seed update — never by hand-editing
the database without updating `lastVerified`.

## Per-scheme trail

### 1. Micro Credit Finance (MCF)

- Source: `https://www.myscheme.gov.in/schemes/mcfnsfdc`, corroborated by
  `https://nsfdc.nic.in/en/micro-credit-finance`, YouthPower India,
  publicservicesmap.in, projectsarthi.com.
- Income ceiling ₹3,00,000/year (rural + urban), effective 08.03.2018:
  given directly in the product spec (Section 43) as confirmed against
  myScheme/NSFDC documentation — seeded as **VERIFIED**.
- Project cost ceiling ₹1.40 lakh, loan ceiling ₹1.25 lakh (90% of
  project cost), interest 2.5% (NSFDC to SCA) / 6.5% (SCA to
  beneficiary), 3-year tenure with 3-month moratorium: consistent
  across every independent secondary source checked — seeded as
  **VERIFIED**.

### 2. Term Loan

- Source: `https://nsfdc.nic.in/en/term-loan`, corroborated by
  paisabazaar.com, flexiloans.com, creditmantri.com.
- Income ceiling ₹3,00,000/year: reported consistently, and matches
  NSFDC's general eligibility mandate — but no Term-Loan-specific
  circular could be read directly in this build environment. Seeded as
  **UNVERIFIED**.
- Project cost range (>₹1.25 lakh to ₹45 lakh), loan ceiling (90% of
  project cost), interest 4%/8% (0.5% rebate for women), 7-year tenure
  with 6-month moratorium (12 months for plantation/construction):
  consistently reported but not directly confirmed against
  nsfdc.nic.in — seeded as **UNVERIFIED**.

### 3. Aajeevika Micro-Finance Yojana (AMY)

- Source: `https://nsfdc.nic.in/en/schemes-to-be-implemented-through-nbfc-mfis`.
- **Income ceiling — explicit source conflict found and not resolved.**
  One aggregator reported ₹30,00,000/year; several others reported
  ₹3,00,000/year (matching NSFDC's general mandate). The ₹30 lakh
  figure is almost certainly a decimal-place error, but that is an
  inference, not a confirmation. Seeded with the ₹3,00,000 working
  figure but marked **UNVERIFIED**, and the conflict is recorded in the
  rule's `verificationNotes` field so the AI/report layer can surface
  it rather than silently picking a side.
- Project cost / loan ceiling: secondary sources describing AMY
  partially reused Micro Credit Finance's figures (₹1.40 lakh / ₹1.25
  lakh), which raises a real risk of conflation between the two
  schemes. Seeded as **UNVERIFIED** pending direct confirmation.
- Interest rate (11% general / 10% women, plus a 2% timely-repayment
  subvention) and tenure (42 months, 3-month moratorium): reported
  consistently across independent sources — seeded as **VERIFIED**.

### 4. Udyam Nidhi Yojana (UNY)

- Source: `https://nsfdc.nic.in/en/udyam-nidhi-yojana`.
- **Name collision risk found.** Search results for this scheme
  repeatedly surfaced "Mahila Udyam Nidhi Scheme," which is actually a
  **separate SIDBI scheme** for women entrepreneurs, not an NSFDC
  scheme. Some project-cost/loan-ceiling figures used here may
  originate from that conflation. Because of this, **every rule for
  this scheme is seeded as UNVERIFIED**, including the category
  restriction (a reasonable inference from NSFDC's mandate, but not a
  confirmed scheme-specific fact).
- Figures used (project cost ≤₹5 lakh, loan ≤₹4.5 lakh at 90%, 5%/13%
  cooperative or 5%/15% SFB interest, 5-year tenure with 3-month
  moratorium) should be treated as indicative only until confirmed
  directly against nsfdc.nic.in.

### 5. Educational Loan Scheme (ELS)

- Source: `https://www.myscheme.gov.in/schemes/els-nsfdc`, corroborated
  by propelld.com, buddy4loan.com, publicservicesmap.in,
  dekhocampus.com, gyandhan.com.
- Income ceiling ₹3,00,000/year, loan ceiling ₹30 lakh (India) / ₹40
  lakh (abroad) or 90% of course cost, interest 2%/6% (India) or 3%/7%
  (abroad) with a 0.5% women's rebate, repayment up to 10 years
  (≤₹10 lakh) or 12 years (>₹10 lakh): this scheme had the strongest,
  most consistent independent corroboration of the five — seeded as
  **VERIFIED**.
- Moratorium length specifically (modeled as 6 months for EMI
  estimates) was not independently confirmed — seeded as
  **UNVERIFIED**, used only as an EMI planning assumption.

## How this shows up in the product

- `backend/prisma/seed.ts` encodes every figure above with its
  `verificationStatus` and a `verificationNotes` field carrying this
  same reasoning.
- The frontend's `DataStatusBadge` renders "Verified official data" or
  "Unverified — not yet confirmed" next to every figure (see
  `frontend/src/components/DataStatusBadge.tsx`).
- CreditChakra AI refuses to state an `UNVERIFIED` figure as fact — see
  the income-limit branch in `backend/src/ai/deterministicFallback.ts`,
  which responds "I couldn't verify this information from the
  available official scheme data" rather than presenting the figure as
  confirmed.
