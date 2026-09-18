import { Router } from "express";
import { prisma } from "../lib/prisma";
import { uuidSchema } from "../validation/schemas";

const router = Router();

// Public: source URLs come only from trusted database metadata
// (Section 105) — never from AI output or user input.
router.get("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const source = await prisma.schemeSource.findUnique({ where: { id } });
    if (!source) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Source not found." } });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      success: true,
      data: { id: source.id, name: source.name, url: source.url, provider: source.provider, retrievedAt: source.retrievedAt },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
