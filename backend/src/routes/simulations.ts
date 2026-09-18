import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { simulationLimiter } from "../middleware/rateLimit";
import { simulationRequestSchema, uuidSchema } from "../validation/schemas";
import { toApplicantInput } from "../lib/dto";
import { runWhatIf } from "../engine/whatIfEngine";
import { calculateEmi } from "../engine/emiEngine";

const router = Router();
router.use(requireAuth);
router.use(simulationLimiter);

// POST /api/simulations — reruns the SAME eligibility engine with an
// allowlisted set of changed fields (Section 61/62). matchScore,
// decisionType, isVerified, source, and rule definitions are never
// accepted from the client here.
router.post("/", async (req, res, next) => {
  try {
    const { baseRecommendationId, changes } = simulationRequestSchema.parse(req.body);

    const baseRecommendation = await prisma.recommendation.findUnique({ where: { id: baseRecommendationId } });
    const ownedRecommendation = assertOwnedBy(baseRecommendation, req.user!.id);

    const profile = await prisma.applicantProfile.findUnique({ where: { id: ownedRecommendation.applicantProfileId } });
    const ownedProfile = assertOwnedBy(profile, req.user!.id);

    const schemes = await prisma.scheme.findMany({ where: { isPrimary: true }, include: { rules: true } });
    const baseApplicantInput = toApplicantInput(ownedProfile);

    const result = runWhatIf(schemes, baseApplicantInput, ownedRecommendation.schemeId, changes);

    const saved = await prisma.simulation.create({
      data: {
        userId: req.user!.id,
        applicantProfileId: ownedProfile.id,
        baseRecommendationId: ownedRecommendation.id,
        changedFields: changes,
        modifiedDecisionType: result.after.decisionType,
        modifiedMatchScore: result.after.matchScore,
        modifiedSchemeId: result.after.schemeId,
        changedRules: result.changedRules,
        financialDelta: result.financialDelta,
        deltaReason: result.deltaReason,
      },
    });

    // Recompute an EMI estimate for the modified scenario so the UI
    // can show a before/after repayment comparison immediately.
    const modifiedPrincipal = changes.requestedLoanAmount ?? baseApplicantInput.requestedLoanAmount;
    const modifiedTenure = changes.preferredTenureMonths ?? baseApplicantInput.preferredTenureMonths;
    const interestRule = schemes
      .find((s) => s.id === ownedRecommendation.schemeId)
      ?.rules.find((r) => r.ruleType === "INTEREST_RATE");
    const moratoriumRule = schemes
      .find((s) => s.id === ownedRecommendation.schemeId)
      ?.rules.find((r) => r.ruleType === "MORATORIUM");

    const emi = calculateEmi({
      principal: modifiedPrincipal,
      annualInterestRate: interestRule?.value ?? 8,
      tenureMonths: modifiedTenure,
      moratoriumMonths: moratoriumRule?.value ?? 3,
    });

    res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        before: result.before,
        after: result.after,
        bestAfter: result.bestAfter,
        changedFields: result.changedFields,
        changedRules: result.changedRules,
        financialDelta: result.financialDelta,
        deltaReason: result.deltaReason,
        modifiedEmiEstimate: { ...emi, dataStatus: "ESTIMATE" },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const sim = await prisma.simulation.findUnique({ where: { id } });
    const owned = assertOwnedBy(sim, req.user!.id);
    res.json({
      success: true,
      data: {
        id: owned.id,
        changedFields: owned.changedFields,
        modifiedDecisionType: owned.modifiedDecisionType,
        modifiedMatchScore: owned.modifiedMatchScore,
        modifiedSchemeId: owned.modifiedSchemeId,
        changedRules: owned.changedRules,
        financialDelta: owned.financialDelta,
        deltaReason: owned.deltaReason,
        createdAt: owned.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
