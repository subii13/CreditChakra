import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { assertOwnedBy } from "../middleware/ownership";
import { partnerRecommendRequestSchema } from "../validation/schemas";

const router = Router();
router.use(requireAuth);

function toPartnerDTO(partner: {
  id: string;
  name: string;
  type: string;
  state: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  isVerifiedAuthorization: boolean;
  dataStatus: string;
}) {
  // Client can never set isVerifiedAuthorization; it's only ever read
  // from the stored record (Section 63/107).
  return {
    id: partner.id,
    name: partner.name,
    type: partner.type,
    state: partner.state,
    district: partner.district,
    latitude: partner.latitude,
    longitude: partner.longitude,
    isVerifiedAuthorization: partner.isVerifiedAuthorization,
    dataStatus: partner.dataStatus,
  };
}

// GET /api/partners — public-ish reference list (still requires auth
// since it's reached from within the authenticated app flow).
router.get("/", async (req, res, next) => {
  try {
    const partners = await prisma.partner.findMany({ take: 100 });
    res.json({ success: true, data: partners.map(toPartnerDTO) });
  } catch (err) {
    next(err);
  }
});

// POST /api/partners/recommend — suitability, not approval probability
// (Section 65). Filters by scheme authorization + geography.
router.post("/recommend", async (req, res, next) => {
  try {
    const { applicantProfileId, schemeId } = partnerRecommendRequestSchema.parse(req.body);

    const profile = await prisma.applicantProfile.findUnique({ where: { id: applicantProfileId } });
    const owned = assertOwnedBy(profile, req.user!.id);

    const partnerSchemes = await prisma.partnerScheme.findMany({
      where: { schemeId },
      include: { partner: true },
    });

    const scored = partnerSchemes
      .map(({ partner }) => {
        const sameState = partner.state === owned.state;
        const sameDistrict = partner.district === owned.district;
        let suitabilityScore = 40;
        if (sameState) suitabilityScore += 30;
        if (sameDistrict) suitabilityScore += 20;
        if (partner.isVerifiedAuthorization) suitabilityScore += 10;
        return { partner, suitabilityScore: Math.min(100, suitabilityScore) };
      })
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    for (const { partner, suitabilityScore } of scored.slice(0, 5)) {
      await prisma.partnerInteraction.create({
        data: {
          userId: req.user!.id,
          applicantProfileId: owned.id,
          partnerId: partner.id,
          schemeId,
          suitabilityScore,
        },
      });
    }

    res.json({
      success: true,
      data: {
        partners: scored.map(({ partner, suitabilityScore }) => ({
          ...toPartnerDTO(partner),
          suitabilityScore,
        })),
        disclaimer: "Partner suitability does not indicate loan approval.",
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
