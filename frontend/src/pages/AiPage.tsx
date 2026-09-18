import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import type { AiMessageDTO } from "../types/domain";

const SUGGESTED_QUESTIONS = [
  "Why did I get recommended this scheme?",
  "What changed in my What-If simulation?",
  "How is my periodic EMI calculated?",
  "What is the current official NSFDC family income limit?",
];

export function AiPage() {
  const { applicantProfileId } = useJourney();
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<AiMessageDTO[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(message: string) {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    const userMessage: AiMessageDTO = { id: `local-${Date.now()}`, role: "user", content: message, evidence: null, source: "user", createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    try {
      const data = await api.post<{ conversationId: string; message: AiMessageDTO }>("/ai/chat", {
        conversationId,
        applicantProfileId: applicantProfileId ?? undefined,
        message,
      });
      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "The AI is temporarily unavailable.";
      setError(message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h1>CreditChakra AI</h1>
      <p className="muted">Answers are grounded in your own stored data and clearly labeled sources — never invented.</p>

      {!applicantProfileId && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p className="muted">No financing path is active yet, so answers will be general. <button className="btn btn--ghost" onClick={() => navigate("/onboarding")}>Start onboarding</button></p>
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {SUGGESTED_QUESTIONS.map((q) => (
          <button key={q} className="btn btn--secondary" onClick={() => send(q)} disabled={sending}>
            {q}
          </button>
        ))}
      </div>

      <div className="card" style={{ minHeight: 240, display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.length === 0 && <p className="muted">Ask a question or pick a suggestion above.</p>}
        {messages.map((m) => (
          <div key={m.id} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
            <div className="card" style={{ background: m.role === "user" ? "var(--color-surface-raised)" : "var(--color-bg)", padding: 12 }}>
              {/* Plain text content only — React escapes this by default, never dangerouslySetInnerHTML (Section 12). */}
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
              {m.role === "assistant" && (
                <div className="muted" style={{ fontSize: "0.8rem", marginTop: 6 }}>
                  {m.source === "llm" ? "AI-generated, grounded in your data" : "Answered from your stored data"}
                </div>
              )}
            </div>
          </div>
        ))}
        {error && <p className="error-text">{error}</p>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{ display: "flex", gap: 8, marginTop: 16 }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask CreditChakra AI..."
          style={{ flex: 1, background: "var(--color-surface-raised)", border: "1px solid var(--color-border)", borderRadius: 10, padding: "10px 14px", color: "var(--color-text)" }}
        />
        <button className="btn btn--primary" type="submit" disabled={sending}>Send</button>
      </form>
    </div>
  );
}
