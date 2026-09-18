import crypto from "node:crypto";
import { env } from "../config/env";

// TEMPORARY (LOCAL_AUTH_MODE only). A minimal, dependency-free stand-in
// for Supabase Auth so this app can be run end-to-end without a real
// Supabase project. This is explicitly a throwaway for local
// demoing — see SECURITY.md's "Temporary local auth mode" section.
// When you're ready for the real thing, delete this file and its call
// sites (backend/src/middleware/auth.ts, backend/src/routes/auth.ts)
// and go back to Supabase-only auth.
//
// Password hashing: scrypt (Node's built-in, no native dependency to
// compile in a throwaway path) rather than Argon2id, which is what the
// product spec calls for in a *real* custom-auth implementation.
// Real/long-term auth here should be Supabase (Argon2-backed) — this
// shim is not that.

const SCRYPT_KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, key) => (err ? reject(err) : resolve(key)));
  });
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

interface LocalTokenPayload {
  sub: string;
  email: string;
  exp: number;
}

const TOKEN_TTL_SECONDS = 24 * 60 * 60; // 24h — a demo convenience; no refresh flow exists in this shim.

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

export function signLocalToken(userId: string, email: string): { token: string; expiresAt: number } {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload: LocalTokenPayload = { sub: userId, email, exp };
  const payloadB64 = base64url(Buffer.from(JSON.stringify(payload)));
  const signature = crypto.createHmac("sha256", env.SESSION_SECRET).update(payloadB64).digest();
  return { token: `${payloadB64}.${base64url(signature)}`, expiresAt: exp };
}

export function verifyLocalToken(token: string): { id: string; email: string } | null {
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  const expectedSignature = crypto.createHmac("sha256", env.SESSION_SECRET).update(payloadB64).digest();
  const providedSignature = Buffer.from(signatureB64, "base64url");
  if (expectedSignature.length !== providedSignature.length || !crypto.timingSafeEqual(expectedSignature, providedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as LocalTokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.sub || !payload.email) return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}
