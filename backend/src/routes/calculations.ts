import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { emiCalculationSchema } from "../validation/schemas";
import { calculateEmi } from "../engine/emiEngine";
import { toJson } from "../lib/json";

const router = Router();
router.use(requireAuth);

// POST /api/calculations/emi — EMI is always computed server-side and
// marked ESTIMATE; the frontend never hardcodes or recomputes it
// (Section 59).
router.post("/emi", async (req, res, next) => {
  try {
    const input = emiCalculationSchema.parse(req.body);

    if (input.recommendationId) {
      const rec = await prisma.recommendation.findUnique({ where: { id: input.recommendationId } });
      assertOwnedBy(rec, req.user!.id);
    }

    const result = calculateEmi(input);

    const saved = await prisma.emiCalculation.create({
      data: {
        userId: req.user!.id,
        recommendationId: input.recommendationId,
        principal: input.principal,
        annualInterestRate: input.annualInterestRate,
        tenureMonths: input.tenureMonths,
        moratoriumMonths: input.moratoriumMonths,
        estimatedPayment: result.estimatedPayment,
        totalInterest: result.totalInterest,
        totalRepayment: result.totalRepayment,
        repaymentMonths: result.repaymentMonths,
        schedule: toJson(result.schedule),
        assumptions: toJson(result.assumptions),
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: saved.id,
        ...result,
        dataStatus: "ESTIMATE",
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
