// Mirrors backend/src/types/domain.ts and the DTOs returned by the
// Express API. This is the single contract between frontend and
// backend (Section 141) — if you change the API response shape,
// update both this file and the backend type, then grep for usages.

export type Goal = "EDUCATION" | "BUSINESS_START" | "BUSINESS_EXPANSION" | "LIVELIHOOD" | "EQUIPMENT" | "OTHER";
export type DecisionType = "ELIGIBLE_MATCH" | "PARTIAL_MATCH" | "NOT_ELIGIBLE" | "INSUFFICIENT_DATA";
export type VerificationStatus = "VERIFIED" | "UNVERIFIED";
export type DataStatus = "VERIFIED_OFFICIAL" | "DEMO_DATA" | "ESTIMATE" | "USER_PROVIDED" | "UNVERIFIED";

export interface ApplicantDTO {
  id: string;
  goal: Goal;
  fullName: string;
  state: string;
  district: string;
  category: string;
  isScCategory: boolean;
  age: number | null;
  familyIncome: number;
  isStudent: boolean;
  isEntrepreneur: boolean;
  hasExistingBusiness: boolean;
  purpose: string | null;
  educationLevel: string | null;
  courseType: string | null;
  courseCost: number | null;
  businessType: string | null;
  existingBusinessType: string | null;
  yearsInOperation: number | null;
  activityType: string | null;
  equipmentType: string | null;
  equipmentCost: number | null;
  projectCost: number;
  requestedLoanAmount: number;
  preferredTenureMonths: number;
  createdAt: string;
  updatedAt: string;
  dataStatus: "USER_PROVIDED";
}

export interface EvaluatedRuleDTO {
  ruleId: string;
  ruleType: string;
  label: string;
  isHardRule: boolean;
  passed: boolean;
  actualValue: string;
  requiredValue: string;
  explanation: string;
  sourceId: string;
  verificationStatus: VerificationStatus;
}

export interface RecommendationDTO {
  id: string;
  schemeId: string;
  decisionType: DecisionType;
  matchScore: number;
  matchedCriteria: EvaluatedRuleDTO[];
  failedHardCriteria: EvaluatedRuleDTO[];
  warnings: string[];
  explanation: string;
  evidenceReferences: string[];
  matchMethodology: string;
  createdAt: string;
}

export interface SchemeRuleDTO {
  id: string;
  ruleType: string;
  isHardRule: boolean;
  label: string;
  explanation: string;
  value: number | null;
  stringValue: string | null;
  unit: string | null;
  verificationStatus: VerificationStatus;
  effectiveFrom: string;
  lastVerified: string;
  source: { id: string; name: string; url: string; retrievedAt: string };
}

export interface SchemeDTO {
  id: string;
  slug: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  isPrimary: boolean;
  rules: SchemeRuleDTO[];
}

export interface EmiResultDTO {
  id?: string;
  estimatedPayment: number;
  totalInterest: number;
  totalRepayment: number;
  repaymentMonths: number;
  schedule: { month: number; payment: number; principalComponent: number; interestComponent: number; remainingBalance: number }[];
  assumptions: string[];
  dataStatus: "ESTIMATE";
}

export interface SimulationResultDTO {
  id: string;
  before: RecommendationLikeResult;
  after: RecommendationLikeResult;
  bestAfter: RecommendationLikeResult;
  changedFields: Record<string, unknown>;
  changedRules: { label: string; before: string; after: string }[];
  financialDelta: { matchScoreDelta: number; decisionChanged: boolean; projectCostDelta: number; loanAmountDelta: number };
  deltaReason: string;
  modifiedEmiEstimate: EmiResultDTO;
}

export interface RecommendationLikeResult {
  schemeId: string;
  schemeSlug: string;
  schemeName: string;
  decisionType: DecisionType;
  matchScore: number;
  matchedCriteria: EvaluatedRuleDTO[];
  failedHardCriteria: EvaluatedRuleDTO[];
  warnings: string[];
  explanation: string;
  evidenceReferences: string[];
  hasUnverifiedFigures: boolean;
}

export interface PartnerDTO {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  isVerifiedAuthorization: boolean;
  dataStatus: DataStatus;
  suitabilityScore?: number;
}

export interface ChecklistItemDTO {
  key: string;
  label: string;
  description: string;
  status: "PENDING" | "COMPLETED";
  completedAt: string | null;
}

export interface ChecklistDTO {
  id: string;
  schemeId: string;
  items: ChecklistItemDTO[];
}

export interface AiMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence: unknown;
  source: "deterministic" | "llm" | "user";
  createdAt: string;
}

export interface ReportDTO {
  id: string;
  content: Record<string, unknown>;
  createdAt: string;
}
