import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { aiLimiter } from "../middleware/rateLimit";
import { aiChatRequestSchema, uuidSchema } from "../validation/schemas";
import { answerDeterministically } from "../ai/deterministicFallback";
import { callLlm } from "../ai/aiService";
import { AppError } from "../lib/errors";
import { toJson } from "../lib/json";

const router = Router();
router.use(requireAuth);
router.use(aiLimiter);

// POST /api/ai/chat — the AI is a read/explain layer only. It never
// issues database mutations and never receives more than the minimum
// context needed to answer (Section 68/104).
router.post("/chat", async (req, res, next) => {
  try {
    const { conversationId, applicantProfileId, message } = aiChatRequestSchema.parse(req.body);

    if (applicantProfileId) {
      const profile = await prisma.applicantProfile.findUnique({ where: { id: applicantProfileId } });
      assertOwnedBy(profile, req.user!.id);
    }

    let conversation = conversationId
      ? await prisma.aiConversation.findUnique({ where: { id: conversationId } })
      : null;
    if (conversation) {
      assertOwnedBy(conversation, req.user!.id);
    } else {
      conversation = await prisma.aiConversation.create({
        data: { userId: req.user!.id, applicantProfileId },
      });
    }

    await prisma.aiMessage.create({
      data: { userId: req.user!.id, conversationId: conversation.id, role: "user", content: message, source: "user" },
    });

    const fallback = await answerDeterministically(req.user!.id, applicantProfileId ?? conversation.applicantProfileId ?? undefined, message);

    let responseContent: string;
    const evidence: unknown = fallback?.evidence ?? [];
    let source: "deterministic" | "llm" = "deterministic";

    if (fallback) {
      responseContent = fallback.content;
    } else {
      try {
        const history = await prisma.aiMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "asc" },
          take: 20,
        });
        responseContent = await callLlm(
          message,
          { applicantSummary: applicantProfileId ? "Applicant has an active profile." : "No profile linked to this question." },
          history.map((h) => ({ role: h.role, content: h.content }))
        );
        source = "llm";
      } catch (err) {
        if (err instanceof AppError && err.code === "LLM_UNAVAILABLE") {
          throw new AppError("NO_EVIDENCE", "I couldn't verify this information from the available official scheme data.");
        }
        throw err;
      }
    }

    const saved = await prisma.aiMessage.create({
      data: {
        userId: req.user!.id,
        conversationId: conversation.id,
        role: "assistant",
        content: responseContent,
        evidence: toJson(evidence),
        source,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        conversationId: conversation.id,
        message: { id: saved.id, role: saved.role, content: saved.content, evidence: saved.evidence, source: saved.source, createdAt: saved.createdAt },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/conversations/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const conversation = await prisma.aiConversation.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } });
    const owned = assertOwnedBy(conversation, req.user!.id);
    res.json({
      success: true,
      data: {
        id: owned.id,
        messages: owned.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, evidence: m.evidence, source: m.source, createdAt: m.createdAt })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
