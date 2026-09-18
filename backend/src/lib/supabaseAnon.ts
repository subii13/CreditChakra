import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env";

// Anon-key client, used only to proxy sign-up/sign-in/sign-out calls
// to Supabase Auth (which owns password hashing, storage, and its own
// abuse protections — Section 7). This client has no elevated
// privileges; it is the server-side equivalent of what the frontend
// could call directly, kept server-side here so we can layer our own
// rate limiting, generic error messages, and audit logging on top.
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
