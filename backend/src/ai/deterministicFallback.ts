import { prisma } from "../lib/prisma";
import { MATCH_METHODOLOGY_EXPLANATION } from "../engine/eligibilityEngine";

export interface FallbackAnswer {
  content: string;
  evidence: { label: string; sourceUrl: string; verificationStatus: string }[];
  intent: string;
}

// The prototype must work without an external LLM (Section 72). Every
// branch here reads ONLY data the authenticated user already owns —
// it never invents a fact. If the relevant record genuinely doesn't
// exist, it returns NO_EVIDENCE rather than guessing.
export async function answerDeterministically(userId: string, applicantProfileId: string | undefined, message: string): Promise<FallbackAnswer | null> {
  const lower = message.toLowerCase();

  const latestRecommendation = applicantProfileId
    ? await prisma.recommendation.findFirst({
        where: { userId, applicantProfileId },
        orderBy: { createdAt: "desc" },
        include: { scheme: { include: { rules: { include: { source: true } } } } },
      })
    : null;

  if (lower.includes("why") && (lower.includes("recommend") || lower.includes("scheme") || lower.includes("match"))) {
    if (!latestRecommendation) return null;
    const evidence = latestRecommendation.scheme.rules.map((r) => ({
      label: r.label,
      sourceUrl: r.source.url,
      verificationStatus: r.verificationStatus,
    }));
    return {
      intent: "recommendation_reason",
      content:
        `You were matched to ${latestRecommendation.scheme.name} with a CreditChakra Match of ${latestRecommendation.matchScore}/100 ` +
        `(decision: ${latestRecommendation.decisionType}). ${latestRecommendation.explanation} ${MATCH_METHODOLOGY_EXPLANATION}`,
      evidence,
    };
  }

  if (lower.includes("what-if") || lower.includes("what if") || lower.includes("simulation") || lower.includes("changed")) {
    const latestSimulation = applicantProfileId
      ? await prisma.simulation.findFirst({
          where: { userId, applicantProfileId },
          orderBy: { createdAt: "desc" },
        })
      : null;
    if (!latestSimulation) return null;
    return {
      intent: "simulation_change",
      content: latestSimulation.deltaReason,
      evidence: [],
    };
  }

  if (lower.includes("emi") || lower.includes("repayment") || lower.includes("periodic payment")) {
    const emi = await prisma.emiCalculation.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    if (!emi) return null;
    return {
      intent: "emi_explanation",
      content:
        `Your estimated payment is ₹${emi.estimatedPayment.toLocaleString("en-IN")}/month over ${emi.repaymentMonths} months, ` +
        `on a principal of ₹${emi.principal.toLocaleString("en-IN")} at ${emi.annualInterestRate}% p.a. ` +
        `Total estimated interest: ₹${emi.totalInterest.toLocaleString("en-IN")}. This is an ESTIMATE, not a sanctioned schedule.`,
      evidence: [],
    };
  }

  if (lower.includes("income limit") || lower.includes("income ceiling") || (lower.includes("income") && lower.includes("nsfdc"))) {
    if (!latestRecommendation) return null;
    const incomeRule = latestRecommendation.scheme.rules.find((r) => r.ruleType === "INCOME_CEILING");
    if (!incomeRule) return null;
    if (incomeRule.verificationStatus === "UNVERIFIED") {
      return {
        intent: "income_limit",
        content:
          "I couldn't verify this information from the available official scheme data. " +
          `The figure on file for ${latestRecommendation.scheme.name} (₹${incomeRule.value?.toLocaleString("en-IN")}/year) is marked UNVERIFIED — ` +
          "please confirm against the official NSFDC source before relying on it.",
        evidence: [{ label: incomeRule.label, sourceUrl: incomeRule.source?.url ?? "", verificationStatus: incomeRule.verificationStatus }],
      };
    }
    return {
      intent: "income_limit",
      content: `${incomeRule.explanation} (Scheme: ${latestRecommendation.scheme.name})`,
      evidence: [{ label: incomeRule.label, sourceUrl: incomeRule.source?.url ?? "", verificationStatus: incomeRule.verificationStatus }],
    };
  }

  if (lower.includes("checklist") || lower.includes("documents") || lower.includes("what do i need")) {
    const checklist = applicantProfileId
      ? await prisma.applicationChecklist.findFirst({ where: { userId, applicantProfileId }, orderBy: { createdAt: "desc" } })
      : null;
    if (!checklist) return null;
    const items = checklist.items as unknown as { label: string; status: string }[];
    return {
      intent: "checklist",
      content: `Your checklist has ${items.filter((i) => i.status === "COMPLETED").length}/${items.length} items complete: ${items.map((i) => `${i.label} (${i.status})`).join(", ")}.`,
      evidence: [],
    };
  }

  return null;
}
