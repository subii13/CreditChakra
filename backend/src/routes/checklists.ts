import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { checklistUpdateSchema, uuidSchema } from "../validation/schemas";

const router = Router();
router.use(requireAuth);

interface ChecklistItemState {
  key: string;
  label: string;
  description: string;
  status: "PENDING" | "COMPLETED";
  completedAt: string | null;
}

// POST /api/checklists — creates or returns the checklist for an
// applicant+scheme pair, seeded from the scheme's checklist definitions.
router.post("/", async (req, res, next) => {
  try {
    const { applicantProfileId, schemeId } = z
      .object({ applicantProfileId: uuidSchema, schemeId: uuidSchema })
      .parse(req.body);

    const profile = await prisma.applicantProfile.findUnique({ where: { id: applicantProfileId } });
    assertOwnedBy(profile, req.user!.id);

    let checklist = await prisma.applicationChecklist.findUnique({
      where: { applicantProfileId_schemeId: { applicantProfileId, schemeId } },
    });

    if (!checklist) {
      const definitions = await prisma.checklistDefinition.findMany({
        where: { schemeId },
        orderBy: { sortOrder: "asc" },
      });
      const items: ChecklistItemState[] = definitions.map((d) => ({
        key: d.itemKey,
        label: d.label,
        description: d.description,
        status: "PENDING",
        completedAt: null,
      }));
      checklist = await prisma.applicationChecklist.create({
        data: { userId: req.user!.id, applicantProfileId, schemeId, items: items as unknown as Prisma.InputJsonValue },
      });
    }

    res.status(201).json({ success: true, data: { id: checklist.id, schemeId, items: checklist.items } });
  } catch (err) {
    next(err);
  }
});

// GET /api/checklists/:schemeId?applicantProfileId=...
router.get("/:schemeId", async (req, res, next) => {
  try {
    const schemeId = uuidSchema.parse(req.params.schemeId);
    const applicantProfileId = uuidSchema.parse(req.query.applicantProfileId);

    const profile = await prisma.applicantProfile.findUnique({ where: { id: applicantProfileId } });
    assertOwnedBy(profile, req.user!.id);

    const checklist = await prisma.applicationChecklist.findUnique({
      where: { applicantProfileId_schemeId: { applicantProfileId, schemeId } },
    });
    const owned = assertOwnedBy(checklist, req.user!.id);

    res.json({ success: true, data: { id: owned.id, schemeId, items: owned.items } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/checklists — toggle a single item's completion status.
router.patch("/", async (req, res, next) => {
  try {
    const { applicantProfileId, schemeId, itemKey, status } = checklistUpdateSchema.parse(req.body);

    const checklist = await prisma.applicationChecklist.findUnique({
      where: { applicantProfileId_schemeId: { applicantProfileId, schemeId } },
    });
    const owned = assertOwnedBy(checklist, req.user!.id);

    const items = (owned.items as unknown as ChecklistItemState[]).map((item) =>
      item.key === itemKey ? { ...item, status, completedAt: status === "COMPLETED" ? new Date().toISOString() : null } : item
    );

    const updated = await prisma.applicationChecklist.update({
      where: { id: owned.id },
      data: { items: items as unknown as Prisma.InputJsonValue },
    });

    res.json({ success: true, data: { id: updated.id, schemeId, items: updated.items } });
  } catch (err) {
    next(err);
  }
});

export default router;
