import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 style={{ fontSize: "2.4rem", marginBottom: 8 }}>Your financing path, figured out.</h1>
        <p className="muted" style={{ maxWidth: 600, fontSize: "1.1rem" }}>
          CreditChakra matches your profile against NSFDC's published Scheduled Caste financing schemes, explains exactly
          why, estimates your repayment, and shows you where to go next — with every figure traceable to its source.
        </p>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button className="btn btn--primary" onClick={() => navigate(user ? "/onboarding" : "/signup")}>
            Find my financing path →
          </button>
          <button className="btn btn--ghost" onClick={() => navigate(user ? "/onboarding?demo=1" : "/signup?demo=1")}>
            Try demo profile
          </button>
        </div>
      </motion.div>

      <div className="grid-2" style={{ marginTop: 48 }}>
        <div className="card">
          <h3>Understand the rules</h3>
          <p className="muted">Every eligibility figure is backed by a source, a verification date, and a status — verified, estimated, or unverified.</p>
        </div>
        <div className="card">
          <h3>See why, not just what</h3>
          <p className="muted">CreditChakra Match is a deterministic, explainable suitability index — never a credit score or approval prediction.</p>
        </div>
        <div className="card">
          <h3>Try What-If</h3>
          <p className="muted">Change your income, project cost, or loan amount and see exactly which rule changed your outcome.</p>
        </div>
        <div className="card">
          <h3>Know where to go next</h3>
          <p className="muted">Partner routing shows channelizing agencies near you, clearly labeled verified or demo data.</p>
        </div>
      </div>
    </div>
  );
}
