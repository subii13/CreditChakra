import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { MyPathPage } from "./pages/MyPathPage";
import { WhatIfPage } from "./pages/WhatIfPage";
import { PartnersPage } from "./pages/PartnersPage";
import { AiPage } from "./pages/AiPage";
import { ChecklistPage } from "./pages/ChecklistPage";
import { ReportPage } from "./pages/ReportPage";
import { SchemesPage } from "./pages/SchemesPage";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="schemes" element={<SchemesPage />} />
        <Route
          path="onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-path"
          element={
            <ProtectedRoute>
              <MyPathPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="what-if"
          element={
            <ProtectedRoute>
              <WhatIfPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="partners"
          element={
            <ProtectedRoute>
              <PartnersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="ai"
          element={
            <ProtectedRoute>
              <AiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="checklist"
          element={
            <ProtectedRoute>
              <ChecklistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="report"
          element={
            <ProtectedRoute>
              <ReportPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
