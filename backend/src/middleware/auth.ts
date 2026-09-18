import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { AppError } from "../lib/errors";

// Authenticates the caller by verifying their Supabase access token
// server-side (never trusting a client-supplied user id). The token
// arrives as a short-lived bearer token set by the frontend's
// Supabase session — see frontend/src/lib/apiClient.ts. We deliberately
// do NOT accept userId/ownerId from the request body anywhere in this
// codebase (Section 10/56/61).
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError("UNAUTHORIZED", "Authentication required.");
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      throw new AppError("UNAUTHORIZED", "Invalid or expired session.");
    }

    req.user = { id: data.user.id, email: data.user.email ?? null };
    next();
  } catch (err) {
    next(err);
  }
}
