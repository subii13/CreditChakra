import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";
import { LOCAL_AUTH_MODE, clearLocalSession, getLocalSession, setLocalSession, type LocalAuthUser } from "../lib/authSession";
import { api, ApiError } from "../lib/apiClient";

type AuthUser = User | LocalAuthUser;

interface AuthContextValue {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface LocalAuthResponse {
  user: LocalAuthUser;
  session: { accessToken: string; expiresAt: number };
}

// Auth state normally lives only in the Supabase client session
// (backed by its own secure token handling) — we never duplicate the
// token into our own localStorage/sessionStorage (Section 16/101).
//
// TEMPORARY exception: when LOCAL_AUTH_MODE is on, there is no
// Supabase session to read, so this uses the sessionStorage-backed
// shim in lib/authSession.ts instead. See SECURITY.md's "Temporary
// local auth mode" — remove this branch when a real Supabase project
// is wired in.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [localUser, setLocalUser] = useState<LocalAuthUser | null>(LOCAL_AUTH_MODE ? getLocalSession()?.user ?? null : null);
  const [loading, setLoading] = useState(!LOCAL_AUTH_MODE);

  useEffect(() => {
    if (LOCAL_AUTH_MODE) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const value: AuthContextValue = LOCAL_AUTH_MODE
    ? {
        user: localUser,
        session: null,
        loading,
        signUp: async (email, password) => {
          try {
            const data = await api.post<LocalAuthResponse>("/auth/register", { email, password });
            setLocalSession({ accessToken: data.session.accessToken, user: data.user });
            setLocalUser(data.user);
            return { error: null };
          } catch (err) {
            return { error: err instanceof ApiError ? err.message : "Could not create account." };
          }
        },
        signIn: async (email, password) => {
          try {
            const data = await api.post<LocalAuthResponse>("/auth/login", { email, password });
            setLocalSession({ accessToken: data.session.accessToken, user: data.user });
            setLocalUser(data.user);
            return { error: null };
          } catch (err) {
            return { error: err instanceof ApiError ? err.message : "Invalid email or password." };
          }
        },
        signOut: async () => {
          await api.post("/auth/logout").catch(() => undefined);
          clearLocalSession();
          setLocalUser(null);
        },
      }
    : {
        user: session?.user ?? null,
        session,
        loading,
        signUp: async (email, password) => {
          const { error } = await supabase.auth.signUp({ email, password });
          return { error: error ? "Could not create account. Please check your details and try again." : null };
        },
        signIn: async (email, password) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          return { error: error ? "Invalid email or password." : null };
        },
        signOut: async () => {
          await supabase.auth.signOut();
        },
      };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
