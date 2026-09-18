import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { applicantCreateSchema, applicantUpdateSchema, uuidSchema } from "../validation/schemas";
import { toApplicantDTO } from "../lib/dto";
import { encryptField } from "../lib/crypto";
import { AppError } from "../lib/errors";

const router = Router();
router.use(requireAuth);

// POST /api/applicants — userId is ALWAYS derived from the
// authenticated session, never from the request body (Section 56).
router.post("/", async (req, res, next) => {
  try {
    const input = applicantCreateSchema.parse(req.body);
    const { contactInfo, ...rest } = input;

    const profile = await prisma.applicantProfile.create({
      data: {
        ...rest,
        userId: req.user!.id,
        contactInfoEncrypted: contactInfo ? encryptField(contactInfo) : null,
      },
    });

    res.status(201).json({ success: true, data: toApplicantDTO(profile) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const profile = await prisma.applicantProfile.findUnique({ where: { id } });
    const owned = assertOwnedBy(profile, req.user!.id);
    res.json({ success: true, data: toApplicantDTO(owned) });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const existing = await prisma.applicantProfile.findUnique({ where: { id } });
    assertOwnedBy(existing, req.user!.id);

    const input = applicantUpdateSchema.parse(req.body);
    const { contactInfo, ...rest } = input;

    if (Object.keys(rest).length === 0 && contactInfo === undefined) {
      throw new AppError("INVALID_INPUT", "No updatable fields provided.");
    }

    const updated = await prisma.applicantProfile.update({
      where: { id },
      data: {
        ...rest,
        ...(contactInfo !== undefined ? { contactInfoEncrypted: contactInfo ? encryptField(contactInfo) : null } : {}),
      },
    });

    res.json({ success: true, data: toApplicantDTO(updated) });
  } catch (err) {
    next(err);
  }
});

export default router;
