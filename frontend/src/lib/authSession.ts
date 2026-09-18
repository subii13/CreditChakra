import { supabase } from "./supabaseClient";

// TEMPORARY: mirrors backend/src/lib/localAuth.ts. When
// VITE_LOCAL_AUTH_MODE is "true", auth goes through our own backend's
// email/password shim instead of Supabase, so the app can be run
// end-to-end without a real Supabase project. See SECURITY.md's
// "Temporary local auth mode". Delete this file (and its call sites in
// AuthContext.tsx and apiClient.ts) when you remove the shim.
export const LOCAL_AUTH_MODE = import.meta.env.VITE_LOCAL_AUTH_MODE === "true";

export interface LocalAuthUser {
  id: string;
  email: string | null;
}

interface StoredLocalSession {
  accessToken: string;
  user: LocalAuthUser;
}

// sessionStorage (not localStorage) so the token doesn't outlive the
// browser tab/session and is at least a little less persistent than a
// "real" long-lived token would be — still a temporary compromise
// versus Supabase's own session handling, which is what production
// should use instead (Section 16/101).
const STORAGE_KEY = "creditchakra.localAuth.temporary";

export function getLocalSession(): StoredLocalSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setLocalSession(session: StoredLocalSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* ignore blocked storage */
  }
}

export function clearLocalSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Single source of truth for "what bearer token do we send right now,"
// used by apiClient.ts regardless of which auth mode is active.
export async function getAccessToken(): Promise<string | undefined> {
  if (LOCAL_AUTH_MODE) {
    return getLocalSession()?.accessToken;
  }
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}
