import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DeveloperPage } from "./pages/DeveloperPage";
import { DashboardPage } from "./pages/DashboardPage";
import { KycFormPage } from "./pages/KycFormPage";
import { KycPendingPage } from "./pages/KycPendingPage";
import { KycResultPage } from "./pages/KycResultPage";
import { KycReviewPage } from "./pages/KycReviewPage";
import { KycStartPage } from "./pages/KycStartPage";
import { LandingPage } from "./pages/LandingPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OnchainAttestPage } from "./pages/OnchainAttestPage";
import { OnchainStatusPage } from "./pages/OnchainStatusPage";

export default function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/kyc/start" element={<KycStartPage />} />
        <Route path="/kyc/form" element={<KycFormPage />} />
        <Route path="/kyc/review" element={<KycReviewPage />} />
        <Route path="/kyc/pending" element={<KycPendingPage />} />
        <Route path="/kyc/result" element={<KycResultPage />} />
        <Route path="/onchain/attest" element={<OnchainAttestPage />} />
        <Route path="/onchain/status" element={<OnchainStatusPage />} />
        <Route path="/dev/integrate" element={<DeveloperPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppLayout>
  );
}
