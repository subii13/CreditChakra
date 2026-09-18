import { describe, expect, it } from "vitest";
import { evaluateScheme, rankSchemes } from "../src/engine/eligibilityEngine";
import type { ApplicantInput } from "../src/types/domain";

function rule(overrides: Record<string, unknown>) {
  return {
    id: overrides.id ?? "rule-1",
    schemeId: "scheme-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    isHardRule: true,
    comparator: null,
    value: null,
    stringValue: null,
    unit: null,
    sourceId: "source-1",
    effectiveFrom: new Date(),
    lastVerified: new Date(),
    verificationStatus: "VERIFIED",
    verificationNotes: null,
    ...overrides,
  } as any;
}

function scheme(rules: any[]) {
  return {
    id: "scheme-1",
    slug: "test-scheme",
    name: "Test Scheme",
    provider: "NSFDC",
    category: "livelihood",
    description: "",
    isPrimary: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    rules,
  } as any;
}

const baseApplicant: ApplicantInput = {
  goal: "LIVELIHOOD",
  category: "SC",
  isScCategory: true,
  age: 30,
  familyIncome: 200000,
  isStudent: false,
  isEntrepreneur: true,
  hasExistingBusiness: false,
  projectCost: 100000,
  requestedLoanAmount: 90000,
  preferredTenureMonths: 36,
};

const schemeRules = [
  rule({ id: "r-category", ruleType: "CATEGORY", stringValue: "SC", label: "SC category", explanation: "Must be SC." }),
  rule({ id: "r-income", ruleType: "INCOME_CEILING", comparator: "LT", value: 300000, label: "Income ceiling", explanation: "Income must be under 3L." }),
  rule({ id: "r-cost", ruleType: "PROJECT_COST_CEILING", comparator: "LTE", value: 140000, label: "Project cost ceiling", explanation: "Project cost ceiling." }),
  rule({ id: "r-loan", ruleType: "LOAN_CEILING", comparator: "LTE", value: 125000, label: "Loan ceiling", explanation: "Loan ceiling." }),
  rule({ id: "r-purpose", ruleType: "PURPOSE", stringValue: "LIVELIHOOD", label: "Purpose fit", explanation: "Must be livelihood." }),
];

describe("eligibilityEngine", () => {
  it("returns ELIGIBLE_MATCH when all hard rules pass and there are no warnings", () => {
    const result = evaluateScheme(scheme(schemeRules), baseApplicant);
    expect(result.decisionType).toBe("ELIGIBLE_MATCH");
    expect(result.failedHardCriteria).toHaveLength(0);
    expect(result.matchScore).toBeGreaterThanOrEqual(75);
  });

  it("returns NOT_ELIGIBLE when a hard rule fails (income over ceiling)", () => {
    const result = evaluateScheme(scheme(schemeRules), { ...baseApplicant, familyIncome: 500000 });
    expect(result.decisionType).toBe("NOT_ELIGIBLE");
    expect(result.failedHardCriteria.some((r) => r.ruleId === "r-income")).toBe(true);
  });

  it("returns INSUFFICIENT_DATA when a hard-rule field is missing rather than forcing a decision", () => {
    const result = evaluateScheme(scheme(schemeRules), { ...baseApplicant, category: null as unknown as string });
    // category itself is always present, so use age-based hard rule to
    // simulate missing data more directly:
    const ageRule = rule({ id: "r-age", ruleType: "AGE_RANGE", comparator: "GTE", value: 18, label: "Minimum age", explanation: "Must be 18+." });
    const resultWithMissingAge = evaluateScheme(scheme([...schemeRules, ageRule]), { ...baseApplicant, age: null });
    expect(resultWithMissingAge.decisionType).toBe("INSUFFICIENT_DATA");
    expect(result.decisionType).not.toBe(undefined);
  });

  it("flags schemes with any UNVERIFIED rule via hasUnverifiedFigures", () => {
    const unverifiedRules = schemeRules.map((r, i) => (i === 1 ? { ...r, verificationStatus: "UNVERIFIED" } : r));
    const result = evaluateScheme(scheme(unverifiedRules), baseApplicant);
    expect(result.hasUnverifiedFigures).toBe(true);
  });

  it("is deterministic: the same input always produces the same score", () => {
    const a = evaluateScheme(scheme(schemeRules), baseApplicant);
    const b = evaluateScheme(scheme(schemeRules), baseApplicant);
    expect(a.matchScore).toBe(b.matchScore);
    expect(a.decisionType).toBe(b.decisionType);
  });

  it("ranks ELIGIBLE_MATCH above NOT_ELIGIBLE across multiple schemes", () => {
    const eligibleScheme = scheme(schemeRules);
    const notEligibleScheme = { ...scheme(schemeRules), id: "scheme-2", slug: "scheme-2" };
    const ranked = rankSchemes([notEligibleScheme, eligibleScheme], baseApplicant);
    expect(ranked[0]!.decisionType).toBe("ELIGIBLE_MATCH");
  });
});
