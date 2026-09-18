// Seeds ONLY: (a) the 5 primary NSFDC schemes with rule figures that
// were researched and cross-checked against multiple independent
// sources (see DATA_SOURCES.md for the full trail and caveats — this
// build environment's network policy blocks direct fetches to
// nsfdc.nic.in / myscheme.gov.in, so every figure below is marked
// VERIFIED only where multiple independent secondary sources agree
// tightly and consistently cite NSFDC, and UNVERIFIED wherever sources
// conflicted or could not be scheme-specifically confirmed — see
// Section 43), (b) synthetic demo partners, and (c) checklist
// definitions. No real personal data, ever (Section 88/112).
import { PrismaClient, RuleType, SchemeSourceProvider, DataStatus } from "@prisma/client";

const prisma = new PrismaClient();

const RETRIEVED_AT = new Date("2026-09-18T00:00:00Z");

interface RuleSeed {
  ruleType: RuleType;
  isHardRule: boolean;
  comparator?: "LTE" | "LT" | "GTE" | "GT" | "EQ";
  value?: number;
  stringValue?: string;
  unit?: string;
  label: string;
  explanation: string;
  effectiveFrom: Date;
  verificationStatus: "VERIFIED" | "UNVERIFIED";
  verificationNotes: string;
}

interface SchemeSeed {
  slug: string;
  name: string;
  category: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  rules: RuleSeed[];
}

const schemeSeeds: SchemeSeed[] = [
  {
    slug: "micro-credit-finance",
    name: "Micro Credit Finance",
    category: "micro-finance",
    description:
      "Micro Credit Finance (MCF) supports small self-employment/livelihood units for Scheduled Caste individuals through State Channelizing Agencies (SCAs).",
    sourceName: "NSFDC / myScheme — Micro Credit Finance",
    sourceUrl: "https://www.myscheme.gov.in/schemes/mcfnsfdc",
    rules: [
      {
        ruleType: RuleType.CATEGORY,
        isHardRule: true,
        stringValue: "SC",
        label: "Scheduled Caste category",
        explanation: "This NSFDC scheme is restricted to applicants belonging to a Scheduled Caste community.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Category restriction consistently reported across NSFDC and myScheme documentation.",
      },
      {
        ruleType: RuleType.INCOME_CEILING,
        isHardRule: true,
        comparator: "LT",
        value: 300000,
        unit: "INR",
        label: "Annual family income ceiling",
        explanation: "Annual family income should be less than ₹3,00,000, in both rural and urban areas.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Confirmed w.e.f. 08.03.2018 per myScheme.gov.in / NSFDC scheme documentation.",
      },
      {
        ruleType: RuleType.PROJECT_COST_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 140000,
        unit: "INR",
        label: "Project cost ceiling",
        explanation: "Units costing up to ₹1.40 lakh are covered under Micro Credit Finance.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistent across NSFDC-derived aggregator sources (YouthPower, publicservicesmap, projectsarthi).",
      },
      {
        ruleType: RuleType.LOAN_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 125000,
        unit: "INR",
        label: "Loan amount ceiling",
        explanation: "Loans of up to 90% of project cost, to a maximum of ₹1.25 lakh per unit.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistent across multiple independent secondary sources citing NSFDC.",
      },
      {
        ruleType: RuleType.PURPOSE,
        isHardRule: true,
        stringValue: "LIVELIHOOD",
        label: "Purpose: livelihood / micro-enterprise",
        explanation: "Micro Credit Finance is designed for small self-employment/livelihood activities.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Scheme purpose as published by NSFDC.",
      },
      {
        ruleType: RuleType.INTEREST_RATE,
        isHardRule: false,
        value: 6.5,
        unit: "PERCENT",
        label: "Beneficiary interest rate",
        explanation: "NSFDC charges 2.5% p.a. to the channelizing agency, which charges 6.5% p.a. to the beneficiary.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistent across independent sources.",
      },
      {
        ruleType: RuleType.TENURE_MAX,
        isHardRule: false,
        comparator: "LTE",
        value: 36,
        unit: "MONTHS",
        label: "Maximum repayment tenure",
        explanation: "Repayable in quarterly instalments within a maximum of 3 years, including a 3-month moratorium.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistent across independent sources.",
      },
      {
        ruleType: RuleType.MORATORIUM,
        isHardRule: false,
        value: 3,
        unit: "MONTHS",
        label: "Moratorium period",
        explanation: "3-month moratorium before quarterly repayment begins.",
        effectiveFrom: new Date("2018-03-08"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistent across independent sources.",
      },
    ],
  },
  {
    slug: "term-loan",
    name: "Term Loan",
    category: "term-loan",
    description:
      "Term Loan finances larger income-generating ventures for Scheduled Caste individuals above the Micro Credit Finance ticket size.",
    sourceName: "NSFDC — Term Loan",
    sourceUrl: "https://nsfdc.nic.in/en/term-loan",
    rules: [
      {
        ruleType: RuleType.CATEGORY,
        isHardRule: true,
        stringValue: "SC",
        label: "Scheduled Caste category",
        explanation: "This NSFDC scheme is restricted to applicants belonging to a Scheduled Caste community.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Category restriction consistently reported.",
      },
      {
        ruleType: RuleType.INCOME_CEILING,
        isHardRule: true,
        comparator: "LT",
        value: 300000,
        unit: "INR",
        label: "Annual family income ceiling",
        explanation: "Annual family income should be below ₹3,00,000, consistent with NSFDC's current general eligibility mandate.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes:
          "Multiple independent aggregators (paisabazaar, flexiloans, creditmantri) converge on ₹3 lakh, matching NSFDC's general mandate, but this build environment could not reach nsfdc.nic.in directly to confirm the Term-Loan-specific circular. Treat as indicative pending direct confirmation.",
      },
      {
        ruleType: RuleType.PROJECT_COST_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 4500000,
        unit: "INR",
        label: "Project cost ceiling",
        explanation: "Project cost above ₹1.25 lakh and up to ₹45 lakh per unit.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Reported consistently by multiple aggregators; not directly confirmed against nsfdc.nic.in in this build environment.",
      },
      {
        ruleType: RuleType.LOAN_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 4050000,
        unit: "INR",
        label: "Loan amount ceiling",
        explanation: "Loans up to 90% of the project cost.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Derived as 90% of the reported project cost ceiling; same confirmation caveat as project cost ceiling.",
      },
      {
        ruleType: RuleType.PURPOSE,
        isHardRule: true,
        stringValue: "BUSINESS_START",
        label: "Purpose: business / income-generating venture",
        explanation: "Term Loan finances larger self-employment and business ventures.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Scheme purpose as reported by aggregators; also reasonably fits BUSINESS_EXPANSION and EQUIPMENT goals.",
      },
      {
        ruleType: RuleType.INTEREST_RATE,
        isHardRule: false,
        value: 8,
        unit: "PERCENT",
        label: "Beneficiary interest rate",
        explanation: "NSFDC charges 4% p.a. to the SCA, which charges 8% p.a. to the beneficiary (0.5% rebate for women).",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Consistent across secondary sources; not directly confirmed against nsfdc.nic.in in this build environment.",
      },
      {
        ruleType: RuleType.TENURE_MAX,
        isHardRule: false,
        comparator: "LTE",
        value: 84,
        unit: "MONTHS",
        label: "Maximum repayment tenure",
        explanation: "Repayable in quarterly instalments within a maximum of 7 years, including a 6-month moratorium (12 months for plantation/construction activities).",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Consistent across secondary sources.",
      },
      {
        ruleType: RuleType.MORATORIUM,
        isHardRule: false,
        value: 6,
        unit: "MONTHS",
        label: "Moratorium period",
        explanation: "6-month moratorium (12 months for plantation/construction activities) before repayment begins.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Consistent across secondary sources.",
      },
    ],
  },
  {
    slug: "aajeevika-micro-finance-yojana",
    name: "Aajeevika Micro-Finance Yojana",
    category: "micro-finance",
    description:
      "Aajeevika Micro-Finance Yojana (AMY) channels small livelihood loans to Scheduled Caste individuals through NBFC-MFIs.",
    sourceName: "NSFDC — Schemes implemented through NBFC-MFIs (AMY)",
    sourceUrl: "https://nsfdc.nic.in/en/schemes-to-be-implemented-through-nbfc-mfis",
    rules: [
      {
        ruleType: RuleType.CATEGORY,
        isHardRule: true,
        stringValue: "SC",
        label: "Scheduled Caste category",
        explanation: "AMY is restricted to applicants belonging to a Scheduled Caste community.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Category restriction consistently reported.",
      },
      {
        ruleType: RuleType.INCOME_CEILING,
        isHardRule: true,
        comparator: "LT",
        value: 300000,
        unit: "INR",
        label: "Annual family income ceiling",
        explanation: "Annual family income ceiling, aligned with NSFDC's general mandate.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes:
          "Sources conflict sharply here: one aggregator reports ₹30,00,000 (almost certainly a decimal/typo error), others report ₹3,00,000 consistent with NSFDC's general mandate. We use ₹3,00,000 as the working figure but flag it UNVERIFIED until confirmed directly against nsfdc.nic.in — do not treat this as confirmed official data.",
      },
      {
        ruleType: RuleType.PROJECT_COST_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 140000,
        unit: "INR",
        label: "Project cost ceiling",
        explanation: "Financial assistance for units/activities costing up to ₹1.40 lakh.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Secondary sources describing AMY partially conflated it with the separate Micro Credit Finance scheme's figures; treat as indicative only.",
      },
      {
        ruleType: RuleType.LOAN_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 140000,
        unit: "INR",
        label: "Loan amount ceiling",
        explanation: "Loans up to ₹1,40,000 (90% of project cost) channelled through NBFC-MFIs.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Same conflation caveat as project cost ceiling above.",
      },
      {
        ruleType: RuleType.PURPOSE,
        isHardRule: true,
        stringValue: "LIVELIHOOD",
        label: "Purpose: livelihood / micro-enterprise",
        explanation: "AMY finances small livelihood and micro-enterprise activities via NBFC-MFI partners.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Scheme purpose consistently reported.",
      },
      {
        ruleType: RuleType.INTEREST_RATE,
        isHardRule: false,
        value: 11,
        unit: "PERCENT",
        label: "Beneficiary interest rate",
        explanation: "11% p.a. for general category, 10% p.a. for women beneficiaries, via NBFC-MFI partners; a further 2% p.a. interest subvention applies for timely repayers.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported across independent sources.",
      },
      {
        ruleType: RuleType.TENURE_MAX,
        isHardRule: false,
        comparator: "LTE",
        value: 42,
        unit: "MONTHS",
        label: "Maximum repayment tenure",
        explanation: "Repayment period of 42 months (3.5 years) with a 3-month moratorium.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported across independent sources.",
      },
      {
        ruleType: RuleType.MORATORIUM,
        isHardRule: false,
        value: 3,
        unit: "MONTHS",
        label: "Moratorium period",
        explanation: "3-month moratorium before repayment begins.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported across independent sources.",
      },
    ],
  },
  {
    slug: "udyam-nidhi-yojana",
    name: "Udyam Nidhi Yojana",
    category: "term-loan",
    description:
      "Udyam Nidhi Yojana (UNY) finances small/micro business activities for Scheduled Caste individuals through cooperative banks/societies and Small Finance Banks.",
    sourceName: "NSFDC — Udyam Nidhi Yojana",
    sourceUrl: "https://nsfdc.nic.in/en/udyam-nidhi-yojana",
    rules: [
      {
        ruleType: RuleType.CATEGORY,
        isHardRule: true,
        stringValue: "SC",
        label: "Scheduled Caste category",
        explanation: "This NSFDC scheme is restricted to applicants belonging to a Scheduled Caste community.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes:
          "Search results returned this scheme's title inconsistently (one result mislabeled it as 'Mahila Udyam Nidhi Scheme', which is actually a separate SIDBI scheme for women entrepreneurs). This entry is for NSFDC's own Udyam Nidhi Yojana; category restriction is a reasonable inference from NSFDC's mandate but is NOT independently confirmed for this specific scheme in this build environment.",
      },
      {
        ruleType: RuleType.INCOME_CEILING,
        isHardRule: true,
        comparator: "LT",
        value: 300000,
        unit: "INR",
        label: "Annual family income ceiling",
        explanation: "Working figure aligned with NSFDC's general ₹3,00,000 mandate; not scheme-specifically confirmed.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Only NSFDC's general mandate figure was found, not a Udyam-Nidhi-specific circular. Surface as UNVERIFIED in the UI.",
      },
      {
        ruleType: RuleType.PROJECT_COST_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 500000,
        unit: "INR",
        label: "Project cost ceiling",
        explanation: "Projects/units costing up to ₹5.00 lakh.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Reported by paisabazaar/bajajfinserv-style aggregators alongside the possibly-conflated SIDBI 'Mahila Udyam Nidhi' scheme; treat as indicative only pending primary-source confirmation.",
      },
      {
        ruleType: RuleType.LOAN_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 450000,
        unit: "INR",
        label: "Loan amount ceiling",
        explanation: "Loans up to 90% of project cost, i.e. up to ₹4.50 lakh.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Same conflation caveat as project cost ceiling above.",
      },
      {
        ruleType: RuleType.PURPOSE,
        isHardRule: true,
        stringValue: "BUSINESS_START",
        label: "Purpose: small / micro business activity",
        explanation: "UNY finances small/micro business activities via cooperative and small finance bank channels.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Scheme purpose is a reasonable inference; also fits EQUIPMENT and BUSINESS_EXPANSION goals.",
      },
      {
        ruleType: RuleType.INTEREST_RATE,
        isHardRule: false,
        value: 13,
        unit: "PERCENT",
        label: "Beneficiary interest rate",
        explanation: "NSFDC charges 5% p.a.; beneficiaries pay 13% p.a. via Cooperative Banks/Societies or 15% p.a. via Small Finance Banks.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Reported by aggregators; not directly confirmed against nsfdc.nic.in in this build environment.",
      },
      {
        ruleType: RuleType.TENURE_MAX,
        isHardRule: false,
        comparator: "LTE",
        value: 60,
        unit: "MONTHS",
        label: "Maximum repayment tenure",
        explanation: "Repayable in quarterly or half-yearly instalments within up to 5 years, including a 3-month moratorium.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Reported by aggregators; not directly confirmed in this build environment.",
      },
      {
        ruleType: RuleType.MORATORIUM,
        isHardRule: false,
        value: 3,
        unit: "MONTHS",
        label: "Moratorium period",
        explanation: "3-month moratorium before repayment begins.",
        effectiveFrom: new Date("2019-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Reported by aggregators; not directly confirmed in this build environment.",
      },
    ],
  },
  {
    slug: "education-loan-scheme",
    name: "Educational Loan Scheme",
    category: "education",
    description:
      "The Educational Loan Scheme (ELS) finances full-time professional/technical courses in India or abroad for Scheduled Caste students.",
    sourceName: "NSFDC / myScheme — Education Loan Scheme",
    sourceUrl: "https://www.myscheme.gov.in/schemes/els-nsfdc",
    rules: [
      {
        ruleType: RuleType.CATEGORY,
        isHardRule: true,
        stringValue: "SC",
        label: "Scheduled Caste category",
        explanation: "This NSFDC scheme is restricted to applicants belonging to a Scheduled Caste community.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Category restriction consistently reported across many independent sources.",
      },
      {
        ruleType: RuleType.INCOME_CEILING,
        isHardRule: true,
        comparator: "LT",
        value: 300000,
        unit: "INR",
        label: "Annual family income ceiling",
        explanation: "Annual family income should be less than ₹3,00,000, in both rural and urban areas.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Very consistently reported (propelld, buddy4loan, publicservicesmap, dekhocampus, gyandhan) — strong independent corroboration.",
      },
      {
        ruleType: RuleType.PURPOSE,
        isHardRule: true,
        stringValue: "EDUCATION",
        label: "Purpose: full-time professional/technical education",
        explanation: "Applicant must be pursuing a regular full-time professional or technical course in a recognized institution, in India or abroad.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported.",
      },
      {
        ruleType: RuleType.LOAN_CEILING,
        isHardRule: true,
        comparator: "LTE",
        value: 4000000,
        unit: "INR",
        label: "Loan amount ceiling",
        explanation: "Up to ₹30 lakh for studies in India and ₹40 lakh for studies abroad (or 90% of course cost).",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported across multiple independent sources.",
      },
      {
        ruleType: RuleType.INTEREST_RATE,
        isHardRule: false,
        value: 6,
        unit: "PERCENT",
        label: "Beneficiary interest rate (India)",
        explanation: "2% p.a. from NSFDC to SCAs, 6% p.a. from SCAs to beneficiaries for studies in India; 3%/7% for studies abroad. 0.5% rebate for women.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported across multiple independent sources.",
      },
      {
        ruleType: RuleType.TENURE_MAX,
        isHardRule: false,
        comparator: "LTE",
        value: 144,
        unit: "MONTHS",
        label: "Maximum repayment tenure",
        explanation: "Up to 10 years for loans up to ₹10,00,000, and up to 12 years for loans above ₹10,00,000.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "VERIFIED",
        verificationNotes: "Consistently reported.",
      },
      {
        ruleType: RuleType.MORATORIUM,
        isHardRule: false,
        value: 6,
        unit: "MONTHS",
        label: "Moratorium period",
        explanation: "Typically course duration plus a grace period before repayment begins (varies by SCA); modelled here as 6 months for EMI estimates.",
        effectiveFrom: new Date("2018-01-01"),
        verificationStatus: "UNVERIFIED",
        verificationNotes: "Exact standard moratorium length was not independently confirmed in this build environment; used as a planning estimate only.",
      },
    ],
  },
];

const partnerSeeds = [
  { name: "Demo SCA — Telangana State Channelizing Agency", type: "SCA", state: "Telangana", district: "Hyderabad", latitude: 17.385, longitude: 78.4867 },
  { name: "Demo SCA — Tamil Nadu Adi Dravidar Corporation", type: "SCA", state: "Tamil Nadu", district: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { name: "Demo NBFC-MFI — Sample Microfinance Partner", type: "NBFC-MFI", state: "Karnataka", district: "Bengaluru Urban", latitude: 12.9716, longitude: 77.5946 },
  { name: "Demo Cooperative Bank — Sample District Cooperative", type: "Cooperative Bank", state: "Maharashtra", district: "Pune", latitude: 18.5204, longitude: 73.8567 },
  { name: "Demo Small Finance Bank — Sample SFB Branch", type: "Small Finance Bank", state: "Rajasthan", district: "Jaipur", latitude: 26.9124, longitude: 75.7873 },
  { name: "Demo SCA — Uttar Pradesh Scheduled Castes Corporation", type: "SCA", state: "Uttar Pradesh", district: "Lucknow", latitude: 26.8467, longitude: 80.9462 },
];

const checklistBySchemeCategory: Record<string, { itemKey: string; label: string; description: string }[]> = {
  "micro-finance": [
    { itemKey: "identity_proof", label: "Identity proof", description: "Aadhaar or another government-issued photo ID." },
    { itemKey: "caste_certificate", label: "Caste certificate", description: "Valid Scheduled Caste certificate issued by a competent authority." },
    { itemKey: "income_certificate", label: "Income certificate", description: "Annual family income certificate from the local revenue authority." },
    { itemKey: "project_report", label: "Project report / activity plan", description: "A brief plan describing the livelihood activity and its cost." },
    { itemKey: "bank_account", label: "Bank account details", description: "An active bank account for loan disbursement." },
  ],
  "term-loan": [
    { itemKey: "identity_proof", label: "Identity proof", description: "Aadhaar or another government-issued photo ID." },
    { itemKey: "caste_certificate", label: "Caste certificate", description: "Valid Scheduled Caste certificate issued by a competent authority." },
    { itemKey: "income_certificate", label: "Income certificate", description: "Annual family income certificate." },
    { itemKey: "project_report", label: "Detailed project report", description: "Cost breakdown, business plan, and projected returns for the venture." },
    { itemKey: "quotations", label: "Equipment/asset quotations", description: "Vendor quotations for machinery, equipment, or construction, where applicable." },
    { itemKey: "bank_account", label: "Bank account details", description: "An active bank account for loan disbursement." },
  ],
  education: [
    { itemKey: "identity_proof", label: "Identity proof", description: "Aadhaar or another government-issued photo ID." },
    { itemKey: "caste_certificate", label: "Caste certificate", description: "Valid Scheduled Caste certificate issued by a competent authority." },
    { itemKey: "income_certificate", label: "Income certificate", description: "Annual family income certificate." },
    { itemKey: "admission_letter", label: "Admission/enrollment letter", description: "Confirmed admission letter from a recognized institution." },
    { itemKey: "fee_structure", label: "Course fee structure", description: "Official fee structure or cost sheet from the institution." },
    { itemKey: "bank_account", label: "Bank account details", description: "An active bank account for loan disbursement." },
  ],
};

async function main() {
  for (const partner of partnerSeeds) {
    const existing = await prisma.partner.findFirst({ where: { name: partner.name } });
    if (!existing) {
      await prisma.partner.create({
        data: {
          name: partner.name,
          type: partner.type,
          state: partner.state,
          district: partner.district,
          latitude: partner.latitude,
          longitude: partner.longitude,
          isVerifiedAuthorization: false,
          dataStatus: DataStatus.DEMO_DATA,
        },
      });
    }
  }
  const partners = await prisma.partner.findMany();

  for (const schemeSeed of schemeSeeds) {
    const scheme = await prisma.scheme.upsert({
      where: { slug: schemeSeed.slug },
      update: {
        name: schemeSeed.name,
        category: schemeSeed.category,
        description: schemeSeed.description,
      },
      create: {
        slug: schemeSeed.slug,
        name: schemeSeed.name,
        provider: SchemeSourceProvider.NSFDC,
        category: schemeSeed.category,
        description: schemeSeed.description,
        isPrimary: true,
      },
    });

    const source = await prisma.schemeSource.create({
      data: {
        schemeId: scheme.id,
        name: schemeSeed.sourceName,
        url: schemeSeed.sourceUrl,
        provider: SchemeSourceProvider.NSFDC,
        retrievedAt: RETRIEVED_AT,
      },
    });

    // Idempotency for repeated seed runs: clear old rules for this
    // scheme before re-inserting the current set.
    await prisma.eligibilityRule.deleteMany({ where: { schemeId: scheme.id } });

    for (const rule of schemeSeed.rules) {
      await prisma.eligibilityRule.create({
        data: {
          schemeId: scheme.id,
          ruleType: rule.ruleType,
          isHardRule: rule.isHardRule,
          comparator: rule.comparator,
          value: rule.value,
          stringValue: rule.stringValue,
          unit: rule.unit,
          label: rule.label,
          explanation: rule.explanation,
          sourceId: source.id,
          effectiveFrom: rule.effectiveFrom,
          lastVerified: RETRIEVED_AT,
          verificationStatus: rule.verificationStatus,
          verificationNotes: rule.verificationNotes,
        },
      });
    }

    const checklistItems = checklistBySchemeCategory[schemeSeed.category] ?? [];
    await prisma.checklistDefinition.deleteMany({ where: { schemeId: scheme.id } });
    for (const [index, item] of checklistItems.entries()) {
      await prisma.checklistDefinition.create({
        data: {
          schemeId: scheme.id,
          itemKey: item.itemKey,
          label: item.label,
          description: item.description,
          sortOrder: index,
        },
      });
    }

    // Link a couple of demo partners to each scheme so partner routing
    // has something to return.
    const shuffled = [...partners].sort(() => Math.random() - 0.5).slice(0, 3);
    for (const partner of shuffled) {
      await prisma.partnerScheme.upsert({
        where: { partnerId_schemeId: { partnerId: partner.id, schemeId: scheme.id } },
        update: {},
        create: { partnerId: partner.id, schemeId: scheme.id },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seeded ${schemeSeeds.length} schemes, ${partnerSeeds.length} demo partners.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
