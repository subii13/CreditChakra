import { Router } from "express";
import pkg from "../../package.json";
import { isProduction } from "../config/env";

const router = Router();

// Only safe, non-sensitive metadata (Section 100) — never DB URLs,
// keys, internal paths, or dependency versions.
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      version: pkg.version,
      environment: isProduction ? "production" : "development",
    },
  });
});

export default router;
