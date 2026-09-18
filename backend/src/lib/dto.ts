import type { ApplicantProfile, EligibilityRule, Scheme, SchemeSource } from "@prisma/client";
import type { ApplicantInput } from "../types/domain";

// Converts a stored profile into the plain engine input shape.
export function toApplicantInput(profile: ApplicantProfile): ApplicantInput {
  return {
    goal: profile.goal,
    category: profile.category,
    isScCategory: profile.isScCategory,
    age: profile.age,
    familyIncome: profile.familyIncome,
    isStudent: profile.isStudent,
    isEntrepreneur: profile.isEntrepreneur,
    hasExistingBusiness: profile.hasExistingBusiness,
    purpose: profile.purpose,
    educationLevel: profile.educationLevel,
    courseCost: profile.courseCost,
    businessType: profile.businessType,
    activityType: profile.activityType,
    equipmentCost: profile.equipmentCost,
    projectCost: profile.projectCost,
    requestedLoanAmount: profile.requestedLoanAmount,
    preferredTenureMonths: profile.preferredTenureMonths,
  };
}

// Response DTOs — never return raw Prisma rows (Section 22). Each of
// these lists exactly the fields the frontend needs; contactInfoEncrypted,
// internal foreign keys we don't want to expose, etc. are left out by
// construction rather than by a blocklist.
export function toApplicantDTO(profile: ApplicantProfile) {
  return {
    id: profile.id,
    goal: profile.goal,
    fullName: profile.fullName,
    state: profile.state,
    district: profile.district,
    category: profile.category,
    isScCategory: profile.isScCategory,
    age: profile.age,
    familyIncome: profile.familyIncome,
    isStudent: profile.isStudent,
    isEntrepreneur: profile.isEntrepreneur,
    hasExistingBusiness: profile.hasExistingBusiness,
    purpose: profile.purpose,
    educationLevel: profile.educationLevel,
    courseType: profile.courseType,
    courseCost: profile.courseCost,
    businessType: profile.businessType,
    existingBusinessType: profile.existingBusinessType,
    yearsInOperation: profile.yearsInOperation,
    activityType: profile.activityType,
    equipmentType: profile.equipmentType,
    equipmentCost: profile.equipmentCost,
    projectCost: profile.projectCost,
    requestedLoanAmount: profile.requestedLoanAmount,
    preferredTenureMonths: profile.preferredTenureMonths,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    dataStatus: "USER_PROVIDED" as const,
  };
}

export function toSchemeDTO(scheme: Scheme & { rules: (EligibilityRule & { source: SchemeSource })[] }) {
  return {
    id: scheme.id,
    slug: scheme.slug,
    name: scheme.name,
    provider: scheme.provider,
    category: scheme.category,
    description: scheme.description,
    isPrimary: scheme.isPrimary,
    rules: scheme.rules.map((rule) => ({
      id: rule.id,
      ruleType: rule.ruleType,
      isHardRule: rule.isHardRule,
      label: rule.label,
      explanation: rule.explanation,
      value: rule.value,
      stringValue: rule.stringValue,
      unit: rule.unit,
      verificationStatus: rule.verificationStatus,
      effectiveFrom: rule.effectiveFrom,
      lastVerified: rule.lastVerified,
      source: {
        id: rule.source.id,
        name: rule.source.name,
        url: rule.source.url,
        retrievedAt: rule.source.retrievedAt,
      },
    })),
  };
}
