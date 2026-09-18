import type { EligibilityRule, Scheme } from "@prisma/client";
import { evaluateScheme, rankSchemes } from "./eligibilityEngine";
import type { ApplicantInput, SchemeEvaluationResult, SimulationAllowedChanges } from "../types/domain";

type SchemeWithRules = Scheme & { rules: EligibilityRule[] };

export interface WhatIfResult {
  before: SchemeEvaluationResult;
  after: SchemeEvaluationResult;
  bestAfter: SchemeEvaluationResult;
  changedFields: SimulationAllowedChanges;
  changedRules: { label: string; before: string; after: string }[];
  financialDelta: {
    matchScoreDelta: number;
    decisionChanged: boolean;
    projectCostDelta: number;
    loanAmountDelta: number;
  };
  deltaReason: string;
}

// Re-runs the SAME eligibility engine used for the original
// recommendation with allowlisted field changes applied — there is no
// separate hardcoded simulation engine (Section 62).
export function runWhatIf(
  schemes: SchemeWithRules[],
  baseApplicant: ApplicantInput,
  baseSchemeId: string,
  changes: SimulationAllowedChanges
): WhatIfResult {
  const baseScheme = schemes.find((s) => s.id === baseSchemeId);
  if (!baseScheme) {
    throw new Error("Base scheme not found for simulation.");
  }

  const modifiedApplicant: ApplicantInput = {
    ...baseApplicant,
    ...(changes.familyIncome != null ? { familyIncome: changes.familyIncome } : {}),
    ...(changes.projectCost != null ? { projectCost: changes.projectCost } : {}),
    ...(changes.requestedLoanAmount != null ? { requestedLoanAmount: changes.requestedLoanAmount } : {}),
    ...(changes.preferredTenureMonths != null ? { preferredTenureMonths: changes.preferredTenureMonths } : {}),
    ...(changes.purpose != null ? { purpose: changes.purpose } : {}),
  };

  const before = evaluateScheme(baseScheme, baseApplicant);
  const after = evaluateScheme(baseScheme, modifiedApplicant);
  const bestAfter = rankSchemes(schemes, modifiedApplicant)[0] ?? after;

  const changedRules: { label: string; before: string; after: string }[] = [];
  const beforeByRule = new Map(before.matchedCriteria.concat(before.failedHardCriteria).map((r) => [r.ruleId, r]));
  const afterByRule = new Map(after.matchedCriteria.concat(after.failedHardCriteria).map((r) => [r.ruleId, r]));
  for (const [ruleId, afterRule] of afterByRule) {
    const beforeRule = beforeByRule.get(ruleId);
    if (beforeRule && beforeRule.passed !== afterRule.passed) {
      changedRules.push({
        label: afterRule.label,
        before: `${beforeRule.actualValue} → ${beforeRule.passed ? "met" : "not met"}`,
        after: `${afterRule.actualValue} → ${afterRule.passed ? "met" : "not met"}`,
      });
    }
  }

  const decisionChanged = before.decisionType !== after.decisionType;
  const matchScoreDelta = after.matchScore - before.matchScore;

  let deltaReason: string;
  if (changedRules.length === 0 && matchScoreDelta === 0) {
    deltaReason = "This change did not affect any evaluated eligibility rule for this scheme.";
  } else if (decisionChanged) {
    deltaReason =
      `Your decision changed from ${before.decisionType} to ${after.decisionType} because: ` +
      changedRules.map((r) => `${r.label} (${r.before} → ${r.after})`).join("; ") +
      ".";
  } else {
    deltaReason =
      `Your CreditChakra Match moved by ${matchScoreDelta >= 0 ? "+" : ""}${matchScoreDelta} points` +
      (changedRules.length > 0 ? ` due to: ${changedRules.map((r) => r.label).join(", ")}.` : ".");
  }

  return {
    before,
    after,
    bestAfter,
    changedFields: changes,
    changedRules,
    financialDelta: {
      matchScoreDelta,
      decisionChanged,
      projectCostDelta: modifiedApplicant.projectCost - baseApplicant.projectCost,
      loanAmountDelta: modifiedApplicant.requestedLoanAmount - baseApplicant.requestedLoanAmount,
    },
    deltaReason,
  };
}
