import { describe, expect, it } from "vitest";
import { runWhatIf } from "../src/engine/whatIfEngine";
import type { ApplicantInput } from "../src/types/domain";

function rule(overrides: Record<string, unknown>) {
  return {
    id: overrides.id ?? "rule-1",
    schemeId: "scheme-1",
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

const schemeRules = [
  rule({ id: "r-income", ruleType: "INCOME_CEILING", comparator: "LT", value: 300000, label: "Income ceiling", explanation: "Income must be under 3L." }),
  rule({ id: "r-cost", ruleType: "PROJECT_COST_CEILING", comparator: "LTE", value: 140000, label: "Project cost ceiling", explanation: "Project cost ceiling." }),
];

const scheme = {
  id: "scheme-1",
  slug: "test-scheme",
  name: "Test Scheme",
  category: "livelihood",
  isPrimary: true,
  rules: schemeRules,
} as any;

const baseApplicant: ApplicantInput = {
  goal: "LIVELIHOOD",
  category: "SC",
  isScCategory: true,
  familyIncome: 250000,
  isStudent: false,
  isEntrepreneur: true,
  hasExistingBusiness: false,
  projectCost: 130000,
  requestedLoanAmount: 100000,
  preferredTenureMonths: 36,
};

describe("whatIfEngine", () => {
  it("reruns the same eligibility engine and reports a decision change when income crosses the ceiling", () => {
    const result = runWhatIf([scheme], baseApplicant, "scheme-1", { familyIncome: 400000 });
    expect(result.before.decisionType).not.toBe("NOT_ELIGIBLE");
    expect(result.after.decisionType).toBe("NOT_ELIGIBLE");
    expect(result.financialDelta.decisionChanged).toBe(true);
    expect(result.changedRules.some((r) => r.label === "Income ceiling")).toBe(true);
  });

  it("reports no rule change when the change does not cross any threshold", () => {
    const result = runWhatIf([scheme], baseApplicant, "scheme-1", { familyIncome: 260000 });
    expect(result.changedRules).toHaveLength(0);
    expect(result.financialDelta.decisionChanged).toBe(false);
  });
});
