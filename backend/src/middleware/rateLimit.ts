import rateLimit from "express-rate-limit";
import { isProduction } from "../config/env";

// Section 19/21: layered, endpoint-specific rate limiting. The default
// in-memory store is fine for a single-instance dev/demo deployment;
// production behind multiple instances should pass a shared store
// (Redis/Upstash) via rateLimit's `store` option — see the note in
// SECURITY.md's "Known limitations" section.
const jsonHandler = (_req: unknown, res: any) => {
  res.status(429).json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please slow down." } });
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: isProduction ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 15 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const simulationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 30 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});

export const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: isProduction ? 120 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
});
