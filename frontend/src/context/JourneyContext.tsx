import { createContext, useContext, useState, type ReactNode } from "react";

// Carries only non-sensitive record IDs between steps of the journey
// (onboarding -> my-path -> what-if -> partners -> ai -> checklist ->
// report). No financial or personal data lives here — every page
// re-fetches the real data it needs from the API by ID, scoped to the
// authenticated user server-side. IDs are cached in sessionStorage
// purely so a page refresh doesn't strand the user mid-flow
// (Section 101 — this is a UI convenience, not sensitive state).
interface JourneyState {
  applicantProfileId: string | null;
  recommendationId: string | null;
  schemeId: string | null;
}

interface JourneyContextValue extends JourneyState {
  setJourney: (next: Partial<JourneyState>) => void;
  clearJourney: () => void;
}

const STORAGE_KEY = "creditchakra.journey";

function loadInitial(): JourneyState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore malformed/blocked storage */
  }
  return { applicantProfileId: null, recommendationId: null, schemeId: null };
}

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<JourneyState>(loadInitial);

  const setJourney = (next: Partial<JourneyState>) => {
    setState((prev) => {
      const merged = { ...prev, ...next };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore blocked storage (private mode etc.) */
      }
      return merged;
    });
  };

  const clearJourney = () => {
    setState({ applicantProfileId: null, recommendationId: null, schemeId: null });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  return <JourneyContext.Provider value={{ ...state, setJourney, clearJourney }}>{children}</JourneyContext.Provider>;
}

export function useJourney(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used within JourneyProvider");
  return ctx;
}
