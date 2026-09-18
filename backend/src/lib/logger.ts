import pino from "pino";
import { isProduction } from "../config/env";

// Redact anything that could leak credentials, session material, or
// bulk personal/financial data into logs (Section 34/109).
export const logger = pino({
  level: isProduction ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers[\"set-cookie\"]",
      "*.password",
      "*.token",
      "*.accessToken",
      "*.refreshToken",
      "*.apiKey",
      "*.serviceRoleKey",
      "*.contactInfoEncrypted",
      "*.familyIncome",
      "*.fullName",
    ],
    censor: "[REDACTED]",
  },
});
