import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import type { ReportDTO } from "../types/domain";

export function ReportPage() {
  const { applicantProfileId, recommendationId } = useJourney();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    if (!applicantProfileId || !recommendationId) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await api.post<ReportDTO>("/reports", { applicantProfileId, recommendationId });
      setReport(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not generate report.");
    } finally {
      setGenerating(false);
    }
  }

  if (!applicantProfileId || !recommendationId) {
    return (
      <div className="card">
        <h2>No active financing path</h2>
        <button className="btn btn--primary" onClick={() => navigate("/onboarding")}>Start onboarding</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Decision-support report</h1>
      <p className="muted">A private summary of your result — only visible to you.</p>
      {!report && (
        <button className="btn btn--primary" disabled={generating} onClick={generate}>
          {generating ? "Generating..." : "Generate report"}
        </button>
      )}
      {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}
      {report && (
        <pre className="card" style={{ whiteSpace: "pre-wrap", marginTop: 24, fontFamily: "inherit" }}>
          {JSON.stringify(report.content, null, 2)}
        </pre>
      )}
    </div>
  );
}
