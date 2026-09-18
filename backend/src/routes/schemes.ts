import { Router } from "express";
import { prisma } from "../lib/prisma";
import { toSchemeDTO } from "../lib/dto";
import { uuidSchema } from "../validation/schemas";

const router = Router();

// Public reference data — no auth required, cacheable (Section 76/99).
router.get("/", async (_req, res, next) => {
  try {
    const schemes = await prisma.scheme.findMany({
      where: { isPrimary: true },
      include: { rules: { include: { source: true } } },
      orderBy: { name: "asc" },
    });
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ success: true, data: schemes.map(toSchemeDTO) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const scheme = await prisma.scheme.findUnique({
      where: { id },
      include: { rules: { include: { source: true } } },
    });
    if (!scheme) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Scheme not found." } });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ success: true, data: toSchemeDTO(scheme) });
  } catch (err) {
    next(err);
  }
});

export default router;
