import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import { DataStatusBadge } from "../components/DataStatusBadge";
import type { EmiResultDTO, RecommendationDTO, SchemeDTO } from "../types/domain";

const DECISION_LABELS: Record<string, string> = {
  ELIGIBLE_MATCH: "Eligible match",
  PARTIAL_MATCH: "Partial match",
  NOT_ELIGIBLE: "Not eligible",
  INSUFFICIENT_DATA: "Need more information",
};

export function MyPathPage() {
  const { applicantProfileId, recommendationId, schemeId } = useJourney();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RecommendationDTO | null>(null);
  const [scheme, setScheme] = useState<SchemeDTO | null>(null);
  const [emi, setEmi] = useState<EmiResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    if (!recommendationId || !schemeId) return;
    let cancelled = false;

    async function load() {
      try {
        const [rec, schemeData] = await Promise.all([
          api.get<RecommendationDTO>(`/recommendations/${recommendationId}`),
          api.get<SchemeDTO>(`/schemes/${schemeId}`),
        ]);
        if (cancelled) return;
        setRecommendation(rec);
        setScheme(schemeData);

        if (rec.decisionType === "ELIGIBLE_MATCH" || rec.decisionType === "PARTIAL_MATCH") {
          const interestRule = schemeData.rules.find((r) => r.ruleType === "INTEREST_RATE");
          const moratoriumRule = schemeData.rules.find((r) => r.ruleType === "MORATORIUM");
          const loanRule = rec.matchedCriteria.find((c) => c.ruleType === "LOAN_CEILING");
          const principal = loanRule ? Number(loanRule.actualValue.replace(/[^\d.]/g, "")) : undefined;
          if (principal) {
            const emiResult = await api.post<EmiResultDTO>("/calculations/emi", {
              principal,
              annualInterestRate: interestRule?.value ?? 8,
              tenureMonths: 36,
              moratoriumMonths: moratoriumRule?.value ?? 3,
              recommendationId: rec.id,
            });
            if (!cancelled) setEmi(emiResult);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load your recommendation.");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [recommendationId, schemeId]);

  if (!applicantProfileId || !recommendationId) {
    return (
      <div className="card">
        <h2>No financing path yet</h2>
        <p className="muted">Complete onboarding to get your NSFDC decision-support result.</p>
        <button className="btn btn--primary" onClick={() => navigate("/onboarding")}>
          Start onboarding
        </button>
      </div>
    );
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!recommendation || !scheme) return <p className="muted">Loading your result...</p>;

  return (
    <div>
      <div className="card">
        <span className="badge badge--verified">{DECISION_LABELS[recommendation.decisionType]}</span>
        <h1 style={{ marginBottom: 4 }}>{scheme.name}</h1>
        <p className="muted">{scheme.description}</p>

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "16px 0" }}>
          <span style={{ fontSize: "2.5rem", fontWeight: 700 }}>{recommendation.matchScore}</span>
          <span className="muted">/ 100 CreditChakra Match</span>
          <button className="btn btn--ghost" style={{ marginLeft: "auto" }} onClick={() => setShowMethodology((s) => !s)}>
            How is this calculated?
          </button>
        </div>
        {showMethodology && <p className="muted card" style={{ background: "var(--color-surface-raised)" }}>{recommendation.matchMethodology}</p>}

        <p>{recommendation.explanation}</p>

        {recommendation.warnings.length > 0 && (
          <ul>
            {recommendation.warnings.map((w, i) => (
              <li key={i} className="muted">{w}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Rule breakdown</h2>
        {[...recommendation.matchedCriteria, ...recommendation.failedHardCriteria].map((rule) => (
          <div key={rule.ruleId} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
            <div>
              <strong>{rule.passed ? "✓" : "✕"} {rule.label}</strong>
              <div className="muted">{rule.explanation}</div>
              <div className="muted">You: {rule.actualValue} · Required: {rule.requiredValue}</div>
            </div>
            <DataStatusBadge status={rule.verificationStatus} />
          </div>
        ))}
      </div>

      {emi && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>Repayment estimate <DataStatusBadge status="ESTIMATE" /></h2>
          <p>Estimated monthly payment: <strong>₹{emi.estimatedPayment.toLocaleString("en-IN")}</strong></p>
          <p className="muted">Total interest: ₹{emi.totalInterest.toLocaleString("en-IN")} · Total repayment: ₹{emi.totalRepayment.toLocaleString("en-IN")} over {emi.repaymentMonths} months</p>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Sources</h2>
        {scheme.rules.map((r) => (
          <div key={r.id} style={{ padding: "6px 0" }}>
            <a href={r.source.url} target="_blank" rel="noreferrer noopener">{r.source.name}</a> — {r.label} <DataStatusBadge status={r.verificationStatus} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
        <Link className="btn btn--primary" to="/what-if">Try What-If →</Link>
        <Link className="btn btn--secondary" to="/partners">Find partners</Link>
        <Link className="btn btn--secondary" to="/checklist">View checklist</Link>
        <Link className="btn btn--secondary" to="/ai">Ask CreditChakra AI</Link>
        <Link className="btn btn--secondary" to="/report">Generate report</Link>
      </div>
    </div>
  );
}
