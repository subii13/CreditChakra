import { describe, expect, it } from "vitest";
import { applicantCreateSchema, simulationRequestSchema } from "../src/validation/schemas";

// Section 122: field-tampering attempts must be rejected/ignored, not
// silently accepted. These schemas are allowlists, so any extra field
// a client tries to inject (userId, matchScore, isVerified, ...) is
// simply not present on the parsed output — it never reaches Prisma.
describe("applicantCreateSchema (field tampering / mass assignment)", () => {
  const validBase = {
    goal: "LIVELIHOOD",
    fullName: "Test Applicant",
    state: "TestState",
    district: "TestDistrict",
    category: "SC",
    isScCategory: true,
    familyIncome: 200000,
    projectCost: 100000,
    requestedLoanAmount: 90000,
    preferredTenureMonths: 36,
  };

  it("accepts a well-formed applicant payload", () => {
    const result = applicantCreateSchema.parse(validBase);
    expect(result.familyIncome).toBe(200000);
  });

  it("strips unknown/forbidden fields like userId, matchScore, isVerified", () => {
    const tampered = {
      ...validBase,
      userId: "some-other-users-id",
      matchScore: 100,
      decisionType: "ELIGIBLE_MATCH",
      isVerified: true,
      admin: true,
    };
    const result = applicantCreateSchema.parse(tampered) as Record<string, unknown>;
    expect(result.userId).toBeUndefined();
    expect(result.matchScore).toBeUndefined();
    expect(result.decisionType).toBeUndefined();
    expect(result.isVerified).toBeUndefined();
    expect(result.admin).toBeUndefined();
  });

  it("rejects an out-of-range familyIncome", () => {
    expect(() => applicantCreateSchema.parse({ ...validBase, familyIncome: -5 })).toThrow();
  });

  it("rejects an invalid goal enum value", () => {
    expect(() => applicantCreateSchema.parse({ ...validBase, goal: "NOT_A_REAL_GOAL" })).toThrow();
  });
});

describe("simulationRequestSchema (What-If allowlist)", () => {
  it("accepts only the allowlisted changeable fields", () => {
    const result = simulationRequestSchema.parse({
      baseRecommendationId: "123e4567-e89b-12d3-a456-426614174000",
      changes: { familyIncome: 250000 },
    });
    expect(result.changes).toEqual({ familyIncome: 250000 });
  });

  it("strips non-allowlisted fields like matchScore/isVerified/authorizationStatus from changes", () => {
    const result = simulationRequestSchema.parse({
      baseRecommendationId: "123e4567-e89b-12d3-a456-426614174000",
      changes: { familyIncome: 250000, matchScore: 100, isVerified: true, authorizationStatus: "APPROVED" },
    }) as { changes: Record<string, unknown> };
    expect(result.changes.matchScore).toBeUndefined();
    expect(result.changes.isVerified).toBeUndefined();
    expect(result.changes.authorizationStatus).toBeUndefined();
  });

  it("rejects an empty changes object", () => {
    expect(() =>
      simulationRequestSchema.parse({ baseRecommendationId: "123e4567-e89b-12d3-a456-426614174000", changes: {} })
    ).toThrow();
  });
});
