import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { recommendationRequestSchema, uuidSchema } from "../validation/schemas";
import { toApplicantInput } from "../lib/dto";
import { toJson } from "../lib/json";
import { rankSchemes, MATCH_METHODOLOGY_EXPLANATION } from "../engine/eligibilityEngine";
import { AppError } from "../lib/errors";

const router = Router();
router.use(requireAuth);

function serializeRecommendation(rec: {
  id: string;
  schemeId: string;
  decisionType: string;
  matchScore: number;
  matchedCriteria: unknown;
  failedHardCriteria: unknown;
  warnings: unknown;
  explanation: string;
  evidenceReferences: unknown;
  createdAt: Date;
}) {
  return {
    id: rec.id,
    schemeId: rec.schemeId,
    decisionType: rec.decisionType,
    matchScore: rec.matchScore,
    matchedCriteria: rec.matchedCriteria,
    failedHardCriteria: rec.failedHardCriteria,
    warnings: rec.warnings,
    explanation: rec.explanation,
    evidenceReferences: rec.evidenceReferences,
    matchMethodology: MATCH_METHODOLOGY_EXPLANATION,
    createdAt: rec.createdAt,
  };
}

// POST /api/recommendations — the engine computes matchScore,
// decisionType, matchedCriteria, evidence, etc. server-side. A client
// can never supply any of these directly (Section 58).
router.post("/", async (req, res, next) => {
  try {
    const { applicantProfileId } = recommendationRequestSchema.parse(req.body);

    const profile = await prisma.applicantProfile.findUnique({ where: { id: applicantProfileId } });
    const owned = assertOwnedBy(profile, req.user!.id);

    const schemes = await prisma.scheme.findMany({ where: { isPrimary: true }, include: { rules: true } });
    if (schemes.length === 0) {
      throw new AppError("SERVER_ERROR", "No schemes are configured.");
    }

    const applicantInput = toApplicantInput(owned);
    const ranked = rankSchemes(schemes, applicantInput);
    const best = ranked[0]!;

    const created = await prisma.recommendation.create({
      data: {
        userId: req.user!.id,
        applicantProfileId: owned.id,
        schemeId: best.schemeId,
        decisionType: best.decisionType,
        matchScore: best.matchScore,
        matchedCriteria: toJson(best.matchedCriteria),
        failedHardCriteria: toJson(best.failedHardCriteria),
        warnings: toJson(best.warnings),
        explanation: best.explanation,
        evidenceReferences: toJson(best.evidenceReferences),
      },
    });

    // Persist rule evaluations for the winning scheme (used by the AI
    // "why did I get recommended this" answer and the report).
    for (const rule of [...best.matchedCriteria, ...best.failedHardCriteria]) {
      await prisma.ruleEvaluation.create({
        data: {
          userId: req.user!.id,
          recommendationId: created.id,
          ruleId: rule.ruleId,
          passed: rule.passed,
          isHardRule: rule.isHardRule,
          actualValue: rule.actualValue,
          requiredValue: rule.requiredValue,
          explanation: rule.explanation,
        },
      });
    }

    res.status(201).json({
      success: true,
      data: {
        recommendation: serializeRecommendation(created),
        alternatives: ranked.slice(1, 4).map((r) => ({
          schemeId: r.schemeId,
          schemeName: r.schemeName,
          decisionType: r.decisionType,
          matchScore: r.matchScore,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const rec = await prisma.recommendation.findUnique({ where: { id } });
    const owned = assertOwnedBy(rec, req.user!.id);
    res.json({ success: true, data: serializeRecommendation(owned) });
  } catch (err) {
    next(err);
  }
});

export default router;
