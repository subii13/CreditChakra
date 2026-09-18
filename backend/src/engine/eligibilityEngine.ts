import type { EligibilityRule, Scheme } from "@prisma/client";
import type { ApplicantInput, DecisionType, EvaluatedRule, SchemeEvaluationResult } from "../types/domain";

// CreditChakra Match methodology (Section 50), documented so the
// "HOW IS THIS MATCH CALCULATED?" UI panel and the AI's explanations
// can quote this directly rather than inventing prose per-call:
//
//   score = 60% x hard-rule pass rate
//         + 20% x profile-field completeness for this scheme
//         + 20% x purpose fit (does the applicant's stated goal match
//                what this scheme is actually for)
//         - 5 points per warning (soft-rule friction), floor 0
//
// This is deterministic: the same applicant + the same active rule set
// always produces the same score. It is a suitability index, not a
// credit score or an approval probability (Section 49).
export const MATCH_METHODOLOGY_EXPLANATION =
  "CreditChakra Match = 60% hard-rule pass rate + 20% profile completeness for this scheme + 20% purpose fit, " +
  "minus 5 points per warning. It reflects how well your profile fits this scheme's published rules — it is not a " +
  "credit score, approval probability, or lending decision.";

type SchemeWithRules = Scheme & { rules: EligibilityRule[] };

function compare(actual: number, comparator: string, target: number): boolean {
  switch (comparator) {
    case "LTE":
      return actual <= target;
    case "LT":
      return actual < target;
    case "GTE":
      return actual >= target;
    case "GT":
      return actual > target;
    case "EQ":
      return actual === target;
    default:
      return false;
  }
}

function evaluateRule(rule: EligibilityRule, applicant: ApplicantInput): EvaluatedRule | null {
  const base = {
    ruleId: rule.id,
    ruleType: rule.ruleType,
    label: rule.label,
    isHardRule: rule.isHardRule,
    sourceId: rule.sourceId,
    verificationStatus: rule.verificationStatus,
  };

  switch (rule.ruleType) {
    case "CATEGORY": {
      const required = rule.stringValue ?? "SC";
      const passed = required === "SC" ? applicant.isScCategory : applicant.category === required;
      return {
        ...base,
        passed,
        actualValue: applicant.isScCategory ? "SC" : applicant.category,
        requiredValue: required,
        explanation: rule.explanation,
      };
    }
    case "INCOME_CEILING": {
      if (rule.value == null || !rule.comparator) return null;
      const passed = compare(applicant.familyIncome, rule.comparator, rule.value);
      return {
        ...base,
        passed,
        actualValue: `₹${applicant.familyIncome.toLocaleString("en-IN")}/year`,
        requiredValue: `${rule.comparator === "LT" ? "<" : "≤"} ₹${rule.value.toLocaleString("en-IN")}/year`,
        explanation: rule.explanation,
      };
    }
    case "PROJECT_COST_CEILING": {
      if (rule.value == null || !rule.comparator) return null;
      const passed = compare(applicant.projectCost, rule.comparator, rule.value);
      return {
        ...base,
        passed,
        actualValue: `₹${applicant.projectCost.toLocaleString("en-IN")}`,
        requiredValue: `${rule.comparator === "LT" ? "<" : "≤"} ₹${rule.value.toLocaleString("en-IN")}`,
        explanation: rule.explanation,
      };
    }
    case "LOAN_CEILING": {
      if (rule.value == null || !rule.comparator) return null;
      const passed = compare(applicant.requestedLoanAmount, rule.comparator, rule.value);
      return {
        ...base,
        passed,
        actualValue: `₹${applicant.requestedLoanAmount.toLocaleString("en-IN")}`,
        requiredValue: `${rule.comparator === "LT" ? "<" : "≤"} ₹${rule.value.toLocaleString("en-IN")}`,
        explanation: rule.explanation,
      };
    }
    case "TENURE_MAX": {
      if (rule.value == null || !rule.comparator) return null;
      const passed = compare(applicant.preferredTenureMonths, rule.comparator, rule.value);
      return {
        ...base,
        passed,
        actualValue: `${applicant.preferredTenureMonths} months`,
        requiredValue: `≤ ${rule.value} months`,
        explanation: rule.explanation,
      };
    }
    case "PURPOSE": {
      const required = rule.stringValue ?? "";
      const passed = matchesPurpose(applicant, required);
      return {
        ...base,
        passed,
        actualValue: applicant.goal,
        requiredValue: required,
        explanation: rule.explanation,
      };
    }
    case "AGE_RANGE": {
      if (applicant.age == null) return null;
      if (rule.value == null || !rule.comparator) return null;
      const passed = compare(applicant.age, rule.comparator, rule.value);
      return {
        ...base,
        passed,
        actualValue: `${applicant.age} years`,
        requiredValue: `${rule.comparator === "LT" ? "<" : "≤"} ${rule.value} years`,
        explanation: rule.explanation,
      };
    }
    default:
      // INTEREST_RATE / MORATORIUM / OTHER are informational and are
      // surfaced as evidence, not evaluated pass/fail.
      return null;
  }
}

function matchesPurpose(applicant: ApplicantInput, schemeGoal: string): boolean {
  if (schemeGoal === "ANY") return true;
  return applicant.goal === schemeGoal;
}

const REQUIRED_FIELDS_BY_RULE_TYPE: Record<string, (a: ApplicantInput) => boolean> = {
  CATEGORY: (a) => a.category != null,
  INCOME_CEILING: (a) => a.familyIncome != null,
  PROJECT_COST_CEILING: (a) => a.projectCost != null,
  LOAN_CEILING: (a) => a.requestedLoanAmount != null,
  TENURE_MAX: (a) => a.preferredTenureMonths != null,
  PURPOSE: (a) => a.goal != null,
  AGE_RANGE: (a) => a.age != null,
};

export function evaluateScheme(scheme: SchemeWithRules, applicant: ApplicantInput): SchemeEvaluationResult {
  const evaluableRules = scheme.rules.filter((r) => r.ruleType in REQUIRED_FIELDS_BY_RULE_TYPE);
  const missingDataRules = evaluableRules.filter((r) => !REQUIRED_FIELDS_BY_RULE_TYPE[r.ruleType]!(applicant));

  const evaluated: EvaluatedRule[] = [];
  for (const rule of evaluableRules) {
    if (missingDataRules.includes(rule)) continue;
    const result = evaluateRule(rule, applicant);
    if (result) evaluated.push(result);
  }

  const hardResults = evaluated.filter((r) => r.isHardRule);
  const failedHard = hardResults.filter((r) => !r.passed);
  const passedHard = hardResults.filter((r) => r.passed);
  const softResults = evaluated.filter((r) => !r.isHardRule);
  const warnings = softResults.filter((r) => !r.passed).map((r) => r.explanation);

  const evidenceReferences = Array.from(new Set(scheme.rules.map((r) => r.sourceId)));
  const hasUnverifiedFigures = scheme.rules.some((r) => r.verificationStatus === "UNVERIFIED");

  const missingHardFields = missingDataRules.filter((r) => r.isHardRule);

  let decisionType: DecisionType;
  let matchScore: number;
  let explanation: string;

  if (missingHardFields.length > 0) {
    decisionType = "INSUFFICIENT_DATA";
    matchScore = 0;
    explanation =
      `We need more information to evaluate ${scheme.name} for you: ` +
      missingHardFields.map((r) => r.label).join(", ") +
      ".";
  } else if (failedHard.length > 0) {
    decisionType = "NOT_ELIGIBLE";
    const hardTotal = hardResults.length || 1;
    matchScore = Math.max(0, Math.round(20 * (passedHard.length / hardTotal)));
    explanation =
      `${scheme.name} does not currently match your profile: ` +
      failedHard.map((r) => `${r.label} (${r.actualValue}, needs ${r.requiredValue})`).join("; ") +
      ".";
  } else {
    const hardTotal = hardResults.length || 1;
    const hardRuleScore = 60 * (passedHard.length / hardTotal);

    const totalRelevantFields = evaluableRules.length || 1;
    const completeness = (evaluableRules.length - missingDataRules.length) / totalRelevantFields;
    const completenessScore = 20 * completeness;

    const purposeRule = evaluated.find((r) => r.ruleType === "PURPOSE");
    const purposeFitScore = purposeRule ? (purposeRule.passed ? 20 : 5) : 15;

    const warningPenalty = Math.min(20, warnings.length * 5);

    matchScore = Math.max(0, Math.min(100, Math.round(hardRuleScore + completenessScore + purposeFitScore - warningPenalty)));

    decisionType = warnings.length > 0 || matchScore < 75 ? "PARTIAL_MATCH" : "ELIGIBLE_MATCH";
    explanation =
      decisionType === "ELIGIBLE_MATCH"
        ? `${scheme.name} is a strong fit: your profile satisfies all published eligibility criteria we could evaluate.`
        : `${scheme.name} is a possible fit, with some caveats: ` + (warnings.length > 0 ? warnings.join("; ") : "partial criteria coverage") + ".";
  }

  return {
    schemeId: scheme.id,
    schemeSlug: scheme.slug,
    schemeName: scheme.name,
    decisionType,
    matchScore,
    matchedCriteria: evaluated.filter((r) => r.passed),
    failedHardCriteria: failedHard,
    warnings,
    explanation,
    evidenceReferences,
    hasUnverifiedFigures,
  };
}

// Ranks schemes for an applicant: eligible/partial matches first (by
// score desc), then insufficient-data, then not-eligible last. Never
// returns a forced recommendation for an applicant we don't have
// enough data on (Section 48).
export function rankSchemes(schemes: SchemeWithRules[], applicant: ApplicantInput): SchemeEvaluationResult[] {
  const rank: Record<DecisionType, number> = {
    ELIGIBLE_MATCH: 0,
    PARTIAL_MATCH: 1,
    INSUFFICIENT_DATA: 2,
    NOT_ELIGIBLE: 3,
  };
  return schemes
    .map((scheme) => evaluateScheme(scheme, applicant))
    .sort((a, b) => {
      if (rank[a.decisionType] !== rank[b.decisionType]) return rank[a.decisionType] - rank[b.decisionType];
      return b.matchScore - a.matchScore;
    });
}
