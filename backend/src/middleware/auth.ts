import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { AppError } from "../lib/errors";
import { env } from "../config/env";
import { verifyLocalToken } from "../lib/localAuth";

// Authenticates the caller by verifying their access token server-side
// (never trusting a client-supplied user id). We deliberately do NOT
// accept userId/ownerId from the request body anywhere in this
// codebase (Section 10/56/61).
//
// TEMPORARY branch: when LOCAL_AUTH_MODE=true, the token is verified
// against the local HMAC-signed shim (src/lib/localAuth.ts) instead of
// Supabase — see SECURITY.md's "Temporary local auth mode". The
// default (LOCAL_AUTH_MODE=false) path is the real one: verify against
// Supabase via the service-role client.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization ?? "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new AppError("UNAUTHORIZED", "Authentication required.");
    }

    if (env.LOCAL_AUTH_MODE) {
      const localUser = verifyLocalToken(token);
      if (!localUser) {
        throw new AppError("UNAUTHORIZED", "Invalid or expired session.");
      }
      req.user = localUser;
      next();
      return;
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
