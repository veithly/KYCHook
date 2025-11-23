import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import { Tag } from "../components/Tag";
import { KYC_STEPS, PROVIDER_METADATA } from "../constants";
import { KycStage, useAppState } from "../state/AppState";

const stageToStep: Record<KycStage, string> = {
  not_started: "start",
  collecting: "form",
  review: "review",
  pending: "pending",
  approved: "pending",
  rejected: "review",
  onchain: "onchain",
};

export function KycResultPage() {
  const { kyc, walrusArtifact } = useAppState();
  const navigate = useNavigate();

  const isApproved = kyc.stage === "approved";
  const activeStep = stageToStep[kyc.stage] ?? "start";
  const statusLabel = isApproved ? "KYC approved" : "Waiting for provider";

  return (
    <section className="page-container" style={{ paddingTop: "2rem" }}>
      <Stepper steps={KYC_STEPS} activeId={activeStep} />
      <div className="grid-two" style={{ marginTop: "1.5rem" }}>
        <Card variant="glass" style={{ textAlign: "center" }}>
          <Icon name={isApproved ? "shield-check" : "parallel-checks"} size={52} tone={isApproved ? "success" : "accent"} />
          <h2>{statusLabel}</h2>
          <p style={{ color: "var(--color-text-secondary)", maxWidth: 520, margin: "0.5rem auto" }}>
            {isApproved
              ? "Provider receipt is signed and Nautilus attested the run. Submit the transaction to mint your credential."
              : "Hang tight a moment longer—provider and TEE attestors are finalizing your proof."}
          </p>
          {walrusArtifact && (
            <div style={{ marginTop: "0.75rem", color: "var(--color-text-secondary)" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
                <span>blob_id:</span>
                <code className="code-block hash-wrap" title={walrusArtifact.blobId}>
                  {walrusArtifact.blobId}
                </code>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center", marginTop: "0.4rem" }}>
                <span>doc_hash:</span>
                <code className="code-block hash-wrap" title={walrusArtifact.docHash}>
                  {walrusArtifact.docHash}
                </code>
              </div>
            </div>
          )}
          <Tag variant={isApproved ? "success" : "warning"} style={{ marginTop: "0.75rem" }}>
            {isApproved ? "Ready for on-chain" : "Still pending"}
          </Tag>
          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", gap: "1rem" }}>
            <Button variant="glow" onClick={() => navigate(isApproved ? "/onchain/attest" : "/kyc/pending")}> 
              {isApproved ? "Push proof on-chain" : "View pending status"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/app")}>
              Back to dashboard
            </Button>
          </div>
        </Card>
        <Card variant="light">
          <h3>Attestation snapshot</h3>
          <div className="card-outline" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <Icon name="chip-tee" tone="accent" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>provider_id</div>
                <code className="code-block hash-wrap" title={PROVIDER_METADATA.providerId}>
                  {PROVIDER_METADATA.providerId}
                </code>
              </div>
            </div>
          </div>
          <div className="card-outline" style={{ marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
              <Icon name="vault" tone="accent" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>tee_measurement</div>
                <code className="code-block hash-wrap" title={PROVIDER_METADATA.teeMeasurement}>
                  {PROVIDER_METADATA.teeMeasurement}
                </code>
              </div>
            </div>
          </div>
          <p style={{ color: "var(--color-text-dark)" }}>
            Once you submit the transaction, dApps can call the registry contract to check your level instantly.
          </p>
        </Card>
      </div>
    </section>
  );
}
