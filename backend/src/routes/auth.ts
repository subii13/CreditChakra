import { Router } from "express";
import { z } from "zod";
import { supabaseAnon } from "../lib/supabaseAnon";
import { authLimiter } from "../middleware/rateLimit";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

// Generic message used for both "email exists" and "email doesn't
// exist" style failures, to avoid account enumeration (Section 19/82).
const GENERIC_AUTH_ERROR = "Invalid email or password, or the account could not be created.";

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const { data, error } = await supabaseAnon.auth.signUp({ email, password });

    if (error || !data.user) {
      res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: GENERIC_AUTH_ERROR } });
      return;
    }

    await prisma.auditEvent.create({ data: { userId: data.user.id, eventType: "REGISTER" } }).catch(() => undefined);

    res.status(201).json({
      success: true,
      data: {
        user: { id: data.user.id, email: data.user.email },
        session: data.session ? { accessToken: data.session.access_token, expiresAt: data.session.expires_at } : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = credentialsSchema.parse(req.body);
    const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      await prisma.auditEvent.create({ data: { eventType: "LOGIN_FAILED" } }).catch(() => undefined);
      res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: GENERIC_AUTH_ERROR } });
      return;
    }

    await prisma.auditEvent.create({ data: { userId: data.user.id, eventType: "LOGIN" } }).catch(() => undefined);

    res.json({
      success: true,
      data: {
        user: { id: data.user.id, email: data.user.email },
        session: { accessToken: data.session.access_token, expiresAt: data.session.expires_at },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    await prisma.auditEvent.create({ data: { userId: req.user!.id, eventType: "LOGOUT" } }).catch(() => undefined);
    res.json({ success: true, data: { message: "Logged out." } });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  res.json({ success: true, data: { id: req.user!.id, email: req.user!.email } });
});

export default router;
