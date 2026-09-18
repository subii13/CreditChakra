import { createClient } from "@supabase/supabase-js";

// Anon/public key only — this is the intended, safe pattern (Section 2).
// Security comes from Supabase RLS + our backend's own authorization
// checks, not from hiding this key.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Supabase's own storage (localStorage-backed session token
    // refresh) is used only to keep the browser session alive across
    // reloads; no separate long-lived token is stored by our own code
    // (Section 16/101).
    persistSession: true,
    autoRefreshToken: true,
  },
});
