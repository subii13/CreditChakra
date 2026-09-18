import type { Goal } from "../types/domain";

// Section 89: personas are INPUT only. They just pre-fill the
// onboarding form with a plausible, synthetic profile — the backend's
// eligibility engine independently determines the actual decision.
// No persona is wired to a hardcoded outcome.
export interface DemoPersona {
  key: string;
  label: string;
  description: string;
  values: {
    goal: Goal;
    fullName: string;
    state: string;
    district: string;
    category: string;
    isScCategory: boolean;
    age: number;
    familyIncome: number;
    isStudent: boolean;
    isEntrepreneur: boolean;
    hasExistingBusiness: boolean;
    educationLevel?: string;
    courseType?: string;
    courseCost?: number;
    businessType?: string;
    projectCost: number;
    requestedLoanAmount: number;
    preferredTenureMonths: number;
  };
}

export const demoPersonas: DemoPersona[] = [
  {
    key: "sc-student",
    label: "SC Student",
    description: "Pursuing a full-time professional course, low family income.",
    values: {
      goal: "EDUCATION",
      fullName: "Demo Student",
      state: "Tamil Nadu",
      district: "Chennai",
      category: "SC",
      isScCategory: true,
      age: 19,
      familyIncome: 220000,
      isStudent: true,
      isEntrepreneur: false,
      hasExistingBusiness: false,
      educationLevel: "Undergraduate",
      courseType: "Engineering",
      courseCost: 800000,
      projectCost: 800000,
      requestedLoanAmount: 700000,
      preferredTenureMonths: 120,
    },
  },
  {
    key: "sc-micro-entrepreneur",
    label: "SC Micro Entrepreneur",
    description: "Small livelihood activity, ticket size within Micro Credit Finance range.",
    values: {
      goal: "LIVELIHOOD",
      fullName: "Demo Entrepreneur",
      state: "Karnataka",
      district: "Bengaluru Urban",
      category: "SC",
      isScCategory: true,
      age: 34,
      familyIncome: 180000,
      isStudent: false,
      isEntrepreneur: true,
      hasExistingBusiness: false,
      businessType: "Tailoring unit",
      projectCost: 130000,
      requestedLoanAmount: 115000,
      preferredTenureMonths: 36,
    },
  },
  {
    key: "sc-larger-project",
    label: "SC Larger Project",
    description: "Business expansion with a larger project cost, Term-Loan range.",
    values: {
      goal: "BUSINESS_EXPANSION",
      fullName: "Demo Expansion Applicant",
      state: "Maharashtra",
      district: "Pune",
      category: "SC",
      isScCategory: true,
      age: 41,
      familyIncome: 280000,
      isStudent: false,
      isEntrepreneur: true,
      hasExistingBusiness: true,
      businessType: "Small manufacturing unit",
      projectCost: 1800000,
      requestedLoanAmount: 1600000,
      preferredTenureMonths: 84,
    },
  },
  {
    key: "edge-case",
    label: "Edge Case",
    description: "Family income just above the published ceiling — a realistic borderline case.",
    values: {
      goal: "LIVELIHOOD",
      fullName: "Demo Edge Case",
      state: "Rajasthan",
      district: "Jaipur",
      category: "SC",
      isScCategory: true,
      age: 29,
      familyIncome: 340000,
      isStudent: false,
      isEntrepreneur: true,
      hasExistingBusiness: false,
      businessType: "Retail micro-unit",
      projectCost: 135000,
      requestedLoanAmount: 120000,
      preferredTenureMonths: 36,
    },
  },
];
