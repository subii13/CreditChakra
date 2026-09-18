import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { reportLimiter } from "../middleware/rateLimit";
import { reportCreateSchema, uuidSchema } from "../validation/schemas";
import { toApplicantDTO } from "../lib/dto";
import { MATCH_METHODOLOGY_EXPLANATION } from "../engine/eligibilityEngine";

const router = Router();
router.use(requireAuth);
router.use(reportLimiter);

// POST /api/reports — a private, immutable decision summary
// (Section 78). Only ever contains the authenticated user's own data.
router.post("/", async (req, res, next) => {
  try {
    const { applicantProfileId, recommendationId } = reportCreateSchema.parse(req.body);

    const profile = await prisma.applicantProfile.findUnique({ where: { id: applicantProfileId } });
    const ownedProfile = assertOwnedBy(profile, req.user!.id);

    const recommendation = await prisma.recommendation.findUnique({ where: { id: recommendationId } });
    const ownedRecommendation = assertOwnedBy(recommendation, req.user!.id);

    const scheme = await prisma.scheme.findUnique({
      where: { id: ownedRecommendation.schemeId },
      include: { rules: { include: { source: true } } },
    });

    const latestSimulation = await prisma.simulation.findFirst({
      where: { userId: req.user!.id, baseRecommendationId: ownedRecommendation.id },
      orderBy: { createdAt: "desc" },
    });

    const emi = await prisma.emiCalculation.findFirst({
      where: { userId: req.user!.id, recommendationId: ownedRecommendation.id },
      orderBy: { createdAt: "desc" },
    });

    const checklist = await prisma.applicationChecklist.findUnique({
      where: { applicantProfileId_schemeId: { applicantProfileId, schemeId: ownedRecommendation.schemeId } },
    });

    const content = {
      applicant: toApplicantDTO(ownedProfile),
      decisionType: ownedRecommendation.decisionType,
      scheme: scheme ? { id: scheme.id, name: scheme.name, category: scheme.category } : null,
      creditChakraMatch: {
        score: ownedRecommendation.matchScore,
        methodology: MATCH_METHODOLOGY_EXPLANATION,
      },
      matchedCriteria: ownedRecommendation.matchedCriteria,
      failedHardCriteria: ownedRecommendation.failedHardCriteria,
      warnings: ownedRecommendation.warnings,
      explanation: ownedRecommendation.explanation,
      repaymentEstimate: emi
        ? {
            estimatedPayment: emi.estimatedPayment,
            totalInterest: emi.totalInterest,
            totalRepayment: emi.totalRepayment,
            repaymentMonths: emi.repaymentMonths,
            dataStatus: "ESTIMATE",
          }
        : null,
      whatIf: latestSimulation
        ? {
            changedFields: latestSimulation.changedFields,
            deltaReason: latestSimulation.deltaReason,
            modifiedDecisionType: latestSimulation.modifiedDecisionType,
            modifiedMatchScore: latestSimulation.modifiedMatchScore,
          }
        : null,
      checklist: checklist ? checklist.items : null,
      sources: scheme?.rules.map((r) => ({ label: r.label, sourceName: r.source.name, sourceUrl: r.source.url, verificationStatus: r.verificationStatus, lastVerified: r.lastVerified })) ?? [],
      disclaimer:
        "This report is a decision-support summary, not a loan sanction or approval. CreditChakra Match is a suitability index, not a credit score. Repayment figures are estimates.",
      generatedAt: new Date().toISOString(),
    };

    const report = await prisma.report.create({
      data: {
        userId: req.user!.id,
        applicantProfileId: ownedProfile.id,
        recommendationId: ownedRecommendation.id,
        content,
      },
    });

    res.status(201).json({ success: true, data: { id: report.id, content: report.content, createdAt: report.createdAt } });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const report = await prisma.report.findUnique({ where: { id } });
    const owned = assertOwnedBy(report, req.user!.id);
    res.json({ success: true, data: { id: owned.id, content: owned.content, createdAt: owned.createdAt } });
  } catch (err) {
    next(err);
  }
});

export default router;
