import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import { DataStatusBadge } from "../components/DataStatusBadge";
import type { PartnerDTO } from "../types/domain";

export function PartnersPage() {
  const { applicantProfileId, schemeId } = useJourney();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<PartnerDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!applicantProfileId || !schemeId) {
      setLoading(false);
      return;
    }
    api
      .post<{ partners: PartnerDTO[] }>("/partners/recommend", { applicantProfileId, schemeId })
      .then((data) => setPartners(data.partners))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load partners."))
      .finally(() => setLoading(false));
  }, [applicantProfileId, schemeId]);

  if (!applicantProfileId || !schemeId) {
    return (
      <div className="card">
        <h2>No active financing path</h2>
        <button className="btn btn--primary" onClick={() => navigate("/onboarding")}>Start onboarding</button>
      </div>
    );
  }

  const mapped = partners.filter((p) => p.latitude != null && p.longitude != null);
  const center: [number, number] = mapped.length > 0 ? [mapped[0]!.latitude!, mapped[0]!.longitude!] : [22.9734, 78.6569];

  return (
    <div>
      <h1>Partner routing</h1>
      <p className="muted">Partner suitability does not indicate loan approval.</p>
      {loading && <p className="muted">Loading partners...</p>}
      {error && <p className="error-text">{error}</p>}

      {mapped.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
          <MapContainer center={center} zoom={5} style={{ height: 360, width: "100%" }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {mapped.map((p) => (
              <Marker key={p.id} position={[p.latitude!, p.longitude!]}>
                <Popup>
                  <strong>{p.name}</strong>
                  <br />
                  {p.type} · {p.district}, {p.state}
                  <br />
                  Suitability: {p.suitabilityScore ?? "—"}/100
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {partners.map((p) => (
        <div key={p.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{p.name}</strong>
              <div className="muted">{p.type} · {p.district}, {p.state}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div>Suitability: {p.suitabilityScore ?? "—"}/100</div>
              <DataStatusBadge status={p.isVerifiedAuthorization ? "VERIFIED_OFFICIAL" : "DEMO_DATA"} />
            </div>
          </div>
        </div>
      ))}

      {!loading && partners.length === 0 && !error && <p className="muted">No partners found for this scheme yet.</p>}
    </div>
  );
}
