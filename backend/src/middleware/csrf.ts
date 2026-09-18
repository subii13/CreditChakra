import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors";
import { corsAllowedOrigins, isProduction } from "../config/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Origin/Sec-Fetch-Site validation for state-changing requests. The API
// is called with a bearer token (not an ambient cookie), which already
// removes most CSRF risk, but this is defense in depth for any future
// cookie-based auth flow and blocks simple cross-site form submissions.
//
// The strict allowlist check only runs in production, where the real
// frontend origin is known ahead of time. In development it's skipped
// (Sec-Fetch-Site is still checked) because this sandbox serves the
// frontend through a proxied hostname that isn't knowable in advance —
// see vite.config.ts's dev proxy and app.ts's matching CORS relaxation.
export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  const secFetchSite = req.headers["sec-fetch-site"];

  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
    if (!origin || (isProduction && !corsAllowedOrigins.includes(origin))) {
      next(new AppError("FORBIDDEN", "Cross-site request rejected."));
      return;
    }
  }

  if (isProduction && origin && !corsAllowedOrigins.includes(origin)) {
    next(new AppError("FORBIDDEN", "Origin not allowed."));
    return;
  }

  next();
}
