import helmet from "helmet";
import type { NextFunction, Request, Response } from "express";
import { isProduction } from "../config/env";

// Helmet + a CSP that allows exactly what the product needs: Leaflet
// tiles from OpenStreetMap, and nothing else external. Development
// relaxes script/style rules for Vite HMR; production does not
// (Section 13/80).
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isProduction ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: isProduction ? ["'self'", "'unsafe-inline'"] : ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: isProduction
        ? ["'self'", "https://*.supabase.co"]
        : ["'self'", "https://*.supabase.co", "ws://localhost:*", "http://localhost:*"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  referrerPolicy: { policy: "same-origin" },
});

// Belt-and-suspenders explicit headers Helmet already sets, kept here
// so the intent is legible without reading Helmet's defaults.
export function extraSecurityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  next();
}
