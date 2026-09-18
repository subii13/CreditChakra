import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import { DataStatusBadge } from "../components/DataStatusBadge";
import type { ApplicantDTO, SimulationResultDTO } from "../types/domain";

export function WhatIfPage() {
  const { applicantProfileId, recommendationId } = useJourney();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<ApplicantDTO | null>(null);
  const [familyIncome, setFamilyIncome] = useState(0);
  const [projectCost, setProjectCost] = useState(0);
  const [requestedLoanAmount, setRequestedLoanAmount] = useState(0);
  const [preferredTenureMonths, setPreferredTenureMonths] = useState(0);
  const [result, setResult] = useState<SimulationResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!applicantProfileId) return;
    api
      .get<ApplicantDTO>(`/applicants/${applicantProfileId}`)
      .then((a) => {
        setApplicant(a);
        setFamilyIncome(a.familyIncome);
        setProjectCost(a.projectCost);
        setRequestedLoanAmount(a.requestedLoanAmount);
        setPreferredTenureMonths(a.preferredTenureMonths);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load your profile."));
  }, [applicantProfileId]);

  async function runSimulation() {
    if (!recommendationId || !applicant) return;
    setRunning(true);
    setError(null);
    try {
      const changes: Record<string, number> = {};
      if (familyIncome !== applicant.familyIncome) changes.familyIncome = familyIncome;
      if (projectCost !== applicant.projectCost) changes.projectCost = projectCost;
      if (requestedLoanAmount !== applicant.requestedLoanAmount) changes.requestedLoanAmount = requestedLoanAmount;
      if (preferredTenureMonths !== applicant.preferredTenureMonths) changes.preferredTenureMonths = preferredTenureMonths;

      if (Object.keys(changes).length === 0) {
        setError("Change at least one value before running the simulation.");
        setRunning(false);
        return;
      }

      const sim = await api.post<SimulationResultDTO>("/simulations", { baseRecommendationId: recommendationId, changes });
      setResult(sim);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not run simulation.");
    } finally {
      setRunning(false);
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

  if (!applicant) return <p className="muted">Loading...</p>;

  return (
    <div>
      <h1>What-If Lab</h1>
      <p className="muted">Adjust your numbers below — nothing is saved until you run the simulation.</p>

      <div className="card">
        <div className="field">
          <label>Annual family income: ₹{familyIncome.toLocaleString("en-IN")}</label>
          <input type="range" min={0} max={1000000} step={5000} value={familyIncome} onChange={(e) => setFamilyIncome(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Project cost: ₹{projectCost.toLocaleString("en-IN")}</label>
          <input type="range" min={10000} max={5000000} step={5000} value={projectCost} onChange={(e) => setProjectCost(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Requested loan amount: ₹{requestedLoanAmount.toLocaleString("en-IN")}</label>
          <input type="range" min={10000} max={5000000} step={5000} value={requestedLoanAmount} onChange={(e) => setRequestedLoanAmount(Number(e.target.value))} />
        </div>
        <div className="field">
          <label>Preferred tenure: {preferredTenureMonths} months</label>
          <input type="range" min={6} max={144} step={6} value={preferredTenureMonths} onChange={(e) => setPreferredTenureMonths(Number(e.target.value))} />
        </div>
        <button className="btn btn--primary" disabled={running} onClick={runSimulation}>
          {running ? "Running..." : "Run simulation"}
        </button>
      </div>

      {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

      {result && (
        <div className="card" style={{ marginTop: 24 }}>
          <h2>Before / After</h2>
          <div className="grid-2">
            <div>
              <h3 className="muted">Before</h3>
              <p>{result.before.decisionType} — {result.before.matchScore}/100</p>
            </div>
            <div>
              <h3 className="muted">After</h3>
              <p>{result.after.decisionType} — {result.after.matchScore}/100</p>
            </div>
          </div>

          <h3>Why did it change?</h3>
          <p>{result.deltaReason}</p>

          {result.changedRules.length > 0 && (
            <ul>
              {result.changedRules.map((r, i) => (
                <li key={i}>
                  <strong>{r.label}</strong>: {r.before} → {r.after}
                </li>
              ))}
            </ul>
          )}

          <div className="card" style={{ background: "var(--color-surface-raised)", marginTop: 16 }}>
            <h3>Repayment under this scenario <DataStatusBadge status="ESTIMATE" /></h3>
            <p>Estimated payment: ₹{result.modifiedEmiEstimate.estimatedPayment.toLocaleString("en-IN")}/month over {result.modifiedEmiEstimate.repaymentMonths} months</p>
          </div>
        </div>
      )}
    </div>
  );
}
