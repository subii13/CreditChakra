import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import type { ChecklistDTO } from "../types/domain";

export function ChecklistPage() {
  const { applicantProfileId, schemeId } = useJourney();
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<ChecklistDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!applicantProfileId || !schemeId) return;
    api
      .post<ChecklistDTO>("/checklists", { applicantProfileId, schemeId })
      .then(setChecklist)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load checklist."));
  }, [applicantProfileId, schemeId]);

  async function toggle(itemKey: string, currentStatus: "PENDING" | "COMPLETED") {
    if (!applicantProfileId || !schemeId) return;
    const nextStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      const updated = await api.patch<ChecklistDTO>("/checklists", { applicantProfileId, schemeId, itemKey, status: nextStatus });
      setChecklist(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update checklist.");
    }
  }

  if (!applicantProfileId || !schemeId) {
    return (
      <div className="card">
        <h2>No active financing path</h2>
        <button className="btn btn--primary" onClick={() => navigate("/onboarding")}>Start onboarding</button>
      </div>
    );
  }

  if (error) return <p className="error-text">{error}</p>;
  if (!checklist) return <p className="muted">Loading checklist...</p>;

  const completed = checklist.items.filter((i) => i.status === "COMPLETED").length;

  return (
    <div>
      <h1>Application checklist</h1>
      <p className="muted">{completed}/{checklist.items.length} complete</p>
      <div className="card">
        {checklist.items.map((item) => (
          <label key={item.key} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--color-border)", alignItems: "flex-start" }}>
            <input type="checkbox" checked={item.status === "COMPLETED"} onChange={() => toggle(item.key, item.status)} style={{ marginTop: 4 }} />
            <div>
              <strong>{item.label}</strong>
              <div className="muted">{item.description}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
