import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/apiClient";
import { DataStatusBadge } from "../components/DataStatusBadge";
import type { SchemeDTO } from "../types/domain";

export function SchemesPage() {
  const [schemes, setSchemes] = useState<SchemeDTO[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<SchemeDTO[]>("/schemes")
      .then(setSchemes)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load schemes."));
  }, []);

  return (
    <div>
      <h1>NSFDC schemes</h1>
      <p className="muted">These are the primary schemes CreditChakra evaluates. Figures are marked by verification status.</p>
      {error && <p className="error-text">{error}</p>}
      {schemes.map((scheme) => (
        <div key={scheme.id} className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 4 }}>{scheme.name}</h2>
          <p className="muted">{scheme.description}</p>
          {scheme.rules.map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--color-border)" }}>
              <span>{r.label}: {r.explanation}</span>
              <DataStatusBadge status={r.verificationStatus} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
