import { z } from "zod";

// Every schema here is an explicit allowlist. Nothing outside these
// fields is ever read from a request body — we never spread req.body
// into a Prisma create/update call (Section 10/61/122).

const GOALS = ["EDUCATION", "BUSINESS_START", "BUSINESS_EXPANSION", "LIVELIHOOD", "EQUIPMENT", "OTHER"] as const;

export const applicantCreateSchema = z.object({
  goal: z.enum(GOALS),
  fullName: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  category: z.string().trim().min(1).max(40),
  isScCategory: z.boolean(),
  age: z.number().int().min(16).max(99).optional(),
  familyIncome: z.number().int().min(0).max(100_000_000),
  isStudent: z.boolean().default(false),
  isEntrepreneur: z.boolean().default(false),
  hasExistingBusiness: z.boolean().default(false),
  purpose: z.string().trim().max(500).optional(),

  educationLevel: z.string().trim().max(80).optional(),
  courseType: z.string().trim().max(80).optional(),
  courseCost: z.number().int().min(0).max(100_000_000).optional(),
  businessType: z.string().trim().max(80).optional(),
  existingBusinessType: z.string().trim().max(80).optional(),
  yearsInOperation: z.number().int().min(0).max(80).optional(),
  activityType: z.string().trim().max(80).optional(),
  equipmentType: z.string().trim().max(80).optional(),
  equipmentCost: z.number().int().min(0).max(100_000_000).optional(),

  projectCost: z.number().int().min(1000).max(100_000_000),
  requestedLoanAmount: z.number().int().min(1000).max(100_000_000),
  preferredTenureMonths: z.number().int().min(1).max(240),

  contactInfo: z.string().trim().max(300).optional(),
});
export type ApplicantCreateInput = z.infer<typeof applicantCreateSchema>;

// PATCH allows the same fields minus goal (goal changes should go
// through a new onboarding submission, not a silent patch).
export const applicantUpdateSchema = applicantCreateSchema.partial().omit({ goal: true });

export const uuidSchema = z.string().uuid();

export const recommendationRequestSchema = z.object({
  applicantProfileId: uuidSchema,
});

export const emiCalculationSchema = z.object({
  principal: z.number().int().min(1000).max(100_000_000),
  annualInterestRate: z.number().min(0).max(50),
  tenureMonths: z.number().int().min(1).max(240),
  moratoriumMonths: z.number().int().min(0).max(60),
  recommendationId: uuidSchema.optional(),
});

// Section 61: the ONLY fields a What-If simulation may change.
export const simulationRequestSchema = z.object({
  baseRecommendationId: uuidSchema,
  changes: z
    .object({
      familyIncome: z.number().int().min(0).max(100_000_000).optional(),
      projectCost: z.number().int().min(1000).max(100_000_000).optional(),
      requestedLoanAmount: z.number().int().min(1000).max(100_000_000).optional(),
      preferredTenureMonths: z.number().int().min(1).max(240).optional(),
      purpose: z.string().trim().max(500).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field must change." }),
});

export const partnerRecommendRequestSchema = z.object({
  applicantProfileId: uuidSchema,
  schemeId: uuidSchema,
});

export const aiChatRequestSchema = z.object({
  conversationId: uuidSchema.optional(),
  applicantProfileId: uuidSchema.optional(),
  message: z.string().trim().min(1).max(2000),
});

export const checklistUpdateSchema = z.object({
  applicantProfileId: uuidSchema,
  schemeId: uuidSchema,
  itemKey: z.string().trim().min(1).max(80),
  status: z.enum(["PENDING", "COMPLETED"]),
});

export const reportCreateSchema = z.object({
  applicantProfileId: uuidSchema,
  recommendationId: uuidSchema,
});
