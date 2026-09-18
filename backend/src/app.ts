import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { corsAllowedOrigins, isProduction } from "./config/env";
import { securityHeaders, extraSecurityHeaders } from "./middleware/security";
import { csrfProtection } from "./middleware/csrf";
import { requestIdMiddleware } from "./middleware/requestId";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { generalApiLimiter } from "./middleware/rateLimit";
import { logger } from "./lib/logger";

import healthRouter from "./routes/health";
import authRouter from "./routes/auth";
import applicantsRouter from "./routes/applicants";
import recommendationsRouter from "./routes/recommendations";
import calculationsRouter from "./routes/calculations";
import simulationsRouter from "./routes/simulations";
import partnersRouter from "./routes/partners";
import aiRouter from "./routes/ai";
import checklistsRouter from "./routes/checklists";
import reportsRouter from "./routes/reports";
import schemesRouter from "./routes/schemes";
import sourcesRouter from "./routes/sources";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as any).requestId,
      redact: ["req.headers.authorization", "req.headers.cookie"],
    })
  );
  app.use(securityHeaders);
  app.use(extraSecurityHeaders);

  // No wildcard CORS for an authenticated API (Section 18).
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsAllowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "256kb" }));
  app.use(csrfProtection);

  // Public endpoints are cacheable; everything else defaults to
  // no-store so private data never sits in a shared/browser cache
  // (Section 102).
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api/schemes") && !req.path.startsWith("/api/sources") && req.path !== "/api/health" && !req.path.startsWith("/api/auth")) {
      res.setHeader("Cache-Control", "private, no-store");
    }
    next();
  });

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/applicants", generalApiLimiter, applicantsRouter);
  app.use("/api/recommendations", generalApiLimiter, recommendationsRouter);
  app.use("/api/calculations", generalApiLimiter, calculationsRouter);
  app.use("/api/simulations", simulationsRouter);
  app.use("/api/partners", generalApiLimiter, partnersRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/checklists", generalApiLimiter, checklistsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/schemes", generalApiLimiter, schemesRouter);
  app.use("/api/sources", generalApiLimiter, sourcesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (!isProduction) {
    // Never weaken production posture to make dev easier, but it's
    // fine to log this once so a developer knows CSP is relaxed.
    logger.info("Running with development CSP (relaxed for Vite HMR).");
  }

  return app;
}
