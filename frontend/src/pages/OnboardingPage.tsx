import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../lib/apiClient";
import { useJourney } from "../context/JourneyContext";
import { demoPersonas } from "../lib/demoPersonas";
import type { ApplicantDTO, Goal, RecommendationDTO } from "../types/domain";

const GOAL_OPTIONS: { value: Goal; label: string }[] = [
  { value: "EDUCATION", label: "Education" },
  { value: "BUSINESS_START", label: "Start a business" },
  { value: "BUSINESS_EXPANSION", label: "Expand an existing business" },
  { value: "LIVELIHOOD", label: "Livelihood / micro-enterprise" },
  { value: "EQUIPMENT", label: "Buy equipment / asset" },
  { value: "OTHER", label: "Other" },
];

interface FormState {
  goal: Goal | "";
  fullName: string;
  state: string;
  district: string;
  category: string;
  isScCategory: boolean;
  age: string;
  familyIncome: string;
  isStudent: boolean;
  isEntrepreneur: boolean;
  hasExistingBusiness: boolean;
  educationLevel: string;
  courseType: string;
  courseCost: string;
  businessType: string;
  existingBusinessType: string;
  yearsInOperation: string;
  activityType: string;
  equipmentType: string;
  equipmentCost: string;
  projectCost: string;
  requestedLoanAmount: string;
  preferredTenureMonths: string;
}

const emptyForm: FormState = {
  goal: "",
  fullName: "",
  state: "",
  district: "",
  category: "SC",
  isScCategory: true,
  age: "",
  familyIncome: "",
  isStudent: false,
  isEntrepreneur: false,
  hasExistingBusiness: false,
  educationLevel: "",
  courseType: "",
  courseCost: "",
  businessType: "",
  existingBusinessType: "",
  yearsInOperation: "",
  activityType: "",
  equipmentType: "",
  equipmentCost: "",
  projectCost: "",
  requestedLoanAmount: "",
  preferredTenureMonths: "",
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { setJourney } = useJourney();
  const [searchParams] = useSearchParams();
  const isDemoIntent = searchParams.get("demo") === "1";

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyPersona(key: string) {
    const persona = demoPersonas.find((p) => p.key === key);
    if (!persona) return;
    const v = persona.values;
    setForm({
      ...emptyForm,
      goal: v.goal,
      fullName: v.fullName,
      state: v.state,
      district: v.district,
      category: v.category,
      isScCategory: v.isScCategory,
      age: String(v.age),
      familyIncome: String(v.familyIncome),
      isStudent: v.isStudent,
      isEntrepreneur: v.isEntrepreneur,
      hasExistingBusiness: v.hasExistingBusiness,
      educationLevel: v.educationLevel ?? "",
      courseType: v.courseType ?? "",
      courseCost: v.courseCost ? String(v.courseCost) : "",
      businessType: v.businessType ?? "",
      projectCost: String(v.projectCost),
      requestedLoanAmount: String(v.requestedLoanAmount),
      preferredTenureMonths: String(v.preferredTenureMonths),
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const applicant = await api.post<ApplicantDTO>("/applicants", {
        goal: form.goal,
        fullName: form.fullName,
        state: form.state,
        district: form.district,
        category: form.category,
        isScCategory: form.isScCategory,
        age: form.age ? Number(form.age) : undefined,
        familyIncome: Number(form.familyIncome),
        isStudent: form.isStudent,
        isEntrepreneur: form.isEntrepreneur,
        hasExistingBusiness: form.hasExistingBusiness,
        educationLevel: form.educationLevel || undefined,
        courseType: form.courseType || undefined,
        courseCost: form.courseCost ? Number(form.courseCost) : undefined,
        businessType: form.businessType || undefined,
        existingBusinessType: form.existingBusinessType || undefined,
        yearsInOperation: form.yearsInOperation ? Number(form.yearsInOperation) : undefined,
        activityType: form.activityType || undefined,
        equipmentType: form.equipmentType || undefined,
        equipmentCost: form.equipmentCost ? Number(form.equipmentCost) : undefined,
        projectCost: Number(form.projectCost),
        requestedLoanAmount: Number(form.requestedLoanAmount),
        preferredTenureMonths: Number(form.preferredTenureMonths),
      });

      const { recommendation } = await api.post<{ recommendation: RecommendationDTO }>("/recommendations", {
        applicantProfileId: applicant.id,
      });

      setJourney({ applicantProfileId: applicant.id, recommendationId: recommendation.id, schemeId: recommendation.schemeId });
      navigate("/my-path");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canGoNextFromStep1 = !!form.goal;
  const canGoNextFromStep2 = !!(form.fullName && form.state && form.district && form.familyIncome);
  const canSubmit = !!(form.projectCost && form.requestedLoanAmount && form.preferredTenureMonths);

  return (
    <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="progress-steps">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`progress-steps__step ${s <= step ? "progress-steps__step--active" : ""}`} />
        ))}
      </div>

      {isDemoIntent && step === 1 && (
        <div className="card" style={{ marginBottom: 24, background: "var(--color-surface-raised)" }}>
          <h3 style={{ marginTop: 0 }}>Try a demo profile</h3>
          <p className="muted">
            Picking a persona only fills in the form below with a synthetic profile — CreditChakra's rule engine still
            computes your actual result from scratch.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {demoPersonas.map((p) => (
              <button key={p.key} className="btn btn--secondary" onClick={() => applyPersona(p.key)} title={p.description}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <section>
          <h2>What are you trying to achieve?</h2>
          <div className="field">
            {GOAL_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                <input type="radio" name="goal" checked={form.goal === opt.value} onChange={() => update("goal", opt.value)} />
                {opt.label}
              </label>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>Tell us about yourself</h2>
          <div className="field">
            <label htmlFor="fullName">Full name</label>
            <input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="state">State</label>
              <input id="state" value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="district">District</label>
              <input id="district" value={form.district} onChange={(e) => update("district", e.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="age">Age</label>
              <input id="age" type="number" min={16} max={99} value={form.age} onChange={(e) => update("age", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="familyIncome">Annual family income (₹)</label>
              <input id="familyIncome" type="number" min={0} value={form.familyIncome} onChange={(e) => update("familyIncome", e.target.value)} />
            </div>
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={form.isScCategory} onChange={(e) => update("isScCategory", e.target.checked)} />
            I belong to a Scheduled Caste community
          </label>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2>A bit more detail</h2>
          {form.goal === "EDUCATION" && (
            <>
              <div className="field">
                <label htmlFor="educationLevel">Education level</label>
                <input id="educationLevel" value={form.educationLevel} onChange={(e) => update("educationLevel", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="courseType">Course / program</label>
                <input id="courseType" value={form.courseType} onChange={(e) => update("courseType", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="courseCost">Course cost (₹)</label>
                <input id="courseCost" type="number" value={form.courseCost} onChange={(e) => update("courseCost", e.target.value)} />
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.isStudent} onChange={(e) => update("isStudent", e.target.checked)} /> I am currently a student
              </label>
            </>
          )}
          {(form.goal === "BUSINESS_START" || form.goal === "BUSINESS_EXPANSION") && (
            <>
              <div className="field">
                <label htmlFor="businessType">Business type</label>
                <input id="businessType" value={form.businessType} onChange={(e) => update("businessType", e.target.value)} />
              </div>
              {form.goal === "BUSINESS_EXPANSION" && (
                <>
                  <div className="field">
                    <label htmlFor="existingBusinessType">Existing business type</label>
                    <input id="existingBusinessType" value={form.existingBusinessType} onChange={(e) => update("existingBusinessType", e.target.value)} />
                  </div>
                  <div className="field">
                    <label htmlFor="yearsInOperation">Years in operation</label>
                    <input id="yearsInOperation" type="number" value={form.yearsInOperation} onChange={(e) => update("yearsInOperation", e.target.value)} />
                  </div>
                </>
              )}
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.isEntrepreneur} onChange={(e) => update("isEntrepreneur", e.target.checked)} /> I am self-employed / an entrepreneur
              </label>
            </>
          )}
          {form.goal === "LIVELIHOOD" && (
            <>
              <div className="field">
                <label htmlFor="activityType">Activity type</label>
                <input id="activityType" value={form.activityType} onChange={(e) => update("activityType", e.target.value)} />
              </div>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.hasExistingBusiness} onChange={(e) => update("hasExistingBusiness", e.target.checked)} /> I already run this activity
              </label>
            </>
          )}
          {form.goal === "EQUIPMENT" && (
            <>
              <div className="field">
                <label htmlFor="equipmentType">Equipment / asset type</label>
                <input id="equipmentType" value={form.equipmentType} onChange={(e) => update("equipmentType", e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="equipmentCost">Equipment cost (₹)</label>
                <input id="equipmentCost" type="number" value={form.equipmentCost} onChange={(e) => update("equipmentCost", e.target.value)} />
              </div>
            </>
          )}
          {form.goal === "OTHER" && (
            <p className="muted">No additional detail needed — you can describe your requirement in the review step.</p>
          )}
        </section>
      )}

      {step === 4 && (
        <section>
          <h2>Financial requirement + review</h2>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="projectCost">Total project / course cost (₹)</label>
              <input id="projectCost" type="number" value={form.projectCost} onChange={(e) => update("projectCost", e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="requestedLoanAmount">Loan amount needed (₹)</label>
              <input id="requestedLoanAmount" type="number" value={form.requestedLoanAmount} onChange={(e) => update("requestedLoanAmount", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="preferredTenureMonths">Preferred repayment tenure (months)</label>
            <input id="preferredTenureMonths" type="number" value={form.preferredTenureMonths} onChange={(e) => update("preferredTenureMonths", e.target.value)} />
          </div>
          <div className="card" style={{ background: "var(--color-surface-raised)" }}>
            <strong>{form.fullName || "Applicant"}</strong> — {GOAL_OPTIONS.find((g) => g.value === form.goal)?.label}, {form.district}, {form.state}
            <br />
            <span className="muted">Family income ₹{form.familyIncome || "—"} · Project cost ₹{form.projectCost || "—"} · Loan ₹{form.requestedLoanAmount || "—"}</span>
          </div>
        </section>
      )}

      {error && <p className="error-text" role="alert" style={{ marginTop: 16 }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button className="btn btn--ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        {step < 4 ? (
          <button
            className="btn btn--primary"
            disabled={(step === 1 && !canGoNextFromStep1) || (step === 2 && !canGoNextFromStep2)}
            onClick={() => setStep((s) => s + 1)}
          >
            Next
          </button>
        ) : (
          <button className="btn btn--primary" disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? "Evaluating..." : "Evaluate my financing path"}
          </button>
        )}
      </div>
    </div>
  );
}
