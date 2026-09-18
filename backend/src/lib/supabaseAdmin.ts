import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// Service-role client. Bypasses RLS entirely. Server-only — never
// import this module from anything reachable by the frontend, never
// log its key, never return it through an API response.
//
// Used for exactly two things here: (1) verifying a user's access
// token in src/middleware/auth.ts via supabase.auth.getUser(token),
// and (2) admin/seed scripts. Ordinary per-request data access goes
// through Prisma with application-level ownership checks, not through
// this client.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
