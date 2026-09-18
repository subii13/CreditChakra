// Shared domain types for the eligibility/EMI/what-if engines and the
// API layer that wraps them. Section 141: this is the single contract —
// route handlers, the engines, and the frontend's TS types (kept in
// frontend/src/types/domain.ts) must all agree with this shape. If you
// need to change it, grep the whole repo for the type name first.

export type Goal = "EDUCATION" | "BUSINESS_START" | "BUSINESS_EXPANSION" | "LIVELIHOOD" | "EQUIPMENT" | "OTHER";

export type DecisionType = "ELIGIBLE_MATCH" | "PARTIAL_MATCH" | "NOT_ELIGIBLE" | "INSUFFICIENT_DATA";

export interface ApplicantInput {
  goal: Goal;
  category: string;
  isScCategory: boolean;
  age?: number | null;
  familyIncome: number;
  isStudent: boolean;
  isEntrepreneur: boolean;
  hasExistingBusiness: boolean;
  purpose?: string | null;
  educationLevel?: string | null;
  courseCost?: number | null;
  businessType?: string | null;
  activityType?: string | null;
  equipmentCost?: number | null;
  projectCost: number;
  requestedLoanAmount: number;
  preferredTenureMonths: number;
}

export interface EvaluatedRule {
  ruleId: string;
  ruleType: string;
  label: string;
  isHardRule: boolean;
  passed: boolean;
  actualValue: string;
  requiredValue: string;
  explanation: string;
  sourceId: string;
  verificationStatus: "VERIFIED" | "UNVERIFIED";
}

export interface SchemeEvaluationResult {
  schemeId: string;
  schemeSlug: string;
  schemeName: string;
  decisionType: DecisionType;
  matchScore: number;
  matchedCriteria: EvaluatedRule[];
  failedHardCriteria: EvaluatedRule[];
  warnings: string[];
  explanation: string;
  evidenceReferences: string[]; // sourceIds
  hasUnverifiedFigures: boolean;
}

export interface EmiInput {
  principal: number;
  annualInterestRate: number;
  tenureMonths: number;
  moratoriumMonths: number;
}

export interface EmiScheduleEntry {
  month: number;
  payment: number;
  principalComponent: number;
  interestComponent: number;
  remainingBalance: number;
}

export interface EmiResult {
  estimatedPayment: number;
  totalInterest: number;
  totalRepayment: number;
  repaymentMonths: number;
  schedule: EmiScheduleEntry[];
  assumptions: string[];
}

// Fields a What-If simulation is allowed to change. Nothing else —
// this is the allowlist enforced server-side (Section 61).
export interface SimulationAllowedChanges {
  familyIncome?: number;
  projectCost?: number;
  requestedLoanAmount?: number;
  preferredTenureMonths?: number;
  purpose?: string;
}
