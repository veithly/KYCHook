import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import { KYC_STEPS } from "../constants";
import { useAppState } from "../state/AppState";

export function KycStartPage() {
  const navigate = useNavigate();
  const { startKyc } = useAppState();

  const handleContinue = () => {
    startKyc();
    navigate("/kyc/form");
  };

  return (
    <section className="page-container section-gap">
      <Stepper steps={KYC_STEPS} activeId="start" />
      <div className="bg-kyc-flow section-gap">
        <div className="grid-two">
          <Card variant="glass">
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              <div className="icon-wrapper-lg">
                  <Icon name="vault" size={36} tone="accent" />
              </div>
              <div>
                <h2 style={{ margin: "0 0 0.25rem 0" }}>Why we need this</h2>
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                  One-time verification, reusable across every supported dApp.
                </p>
              </div>
            </div>
            <ul className="feature-list">
              <li>
                <Icon name="check-circle" size={20} tone="success" />
                <span>Only hashes + attestation references live on-chain.</span>
              </li>
              <li>
                <Icon name="check-circle" size={20} tone="success" />
                <span>Raw documents encrypted via Walrus + Seal policy controls.</span>
              </li>
              <li>
                 <Icon name="check-circle" size={20} tone="success" />
                 <span>You can revoke or refresh at any point.</span>
              </li>
            </ul>
          </Card>
          <Card variant="light">
            <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0" }}>Consent</h3>
                <p style={{ color: "var(--color-text-dark)", lineHeight: 1.6 }}>
                  By continuing you agree to share the submitted documents with KYCHook and the selected provider solely for
                  identity validation on Sui.
                </p>
            </div>
            <div className="badge-stack">
              <span className="pill-badge">GDPR-friendly</span>
              <span className="pill-badge">Zero-knowledge ready</span>
            </div>
            <div className="button-row" style={{ marginTop: "2.5rem" }}>
              <Button variant="glow" onClick={handleContinue} className="btn-magnetic">
                Continue to form
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
