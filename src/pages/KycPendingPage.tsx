import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import { Tag } from "../components/Tag";
import { KYC_STEPS } from "../constants";
import { useAppState } from "../state/AppState";

export function KycPendingPage() {
  const navigate = useNavigate();
  const { kyc, walrusArtifact } = useAppState();

  useEffect(() => {
    if (kyc.stage === "approved") {
      navigate("/kyc/result");
    }
  }, [kyc.stage, navigate]);

  const isRejected = kyc.stage === "rejected";

  return (
    <section className="page-container" style={{ paddingTop: "2rem" }}>
      <Stepper steps={KYC_STEPS} activeId="pending" />
      <Card variant="glass" style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <Icon name={isRejected ? "alert-triangle" : "parallel-checks"} size={56} tone={isRejected ? "warning" : "accent"} />
          {!isRejected && <span className="beacon" style={{ position: "absolute", inset: "-8px" }} />}
        </div>
        <h2>{isRejected ? "Verification failed" : "Verification in progress"}</h2>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: 520, margin: "0.5rem auto" }}>
          {kyc.reviewNotes ?? "Provider and Nautilus are synchronizing receipts. This typically takes under 2 minutes."}
        </p>
        <div className="grid-two" style={{ marginTop: "1.5rem", textAlign: "left" }}>
          <Card variant="light">
            <h4 style={{ marginTop: 0 }}>Artifacts</h4>
            {walrusArtifact ? (
              <div className="stagger-list" style={{ display: "grid", gap: "0.5rem" }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>blob_id</div>
                  <code className="code-block hash-wrap" title={walrusArtifact.blobId}>
                    {walrusArtifact.blobId}
                  </code>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>doc_hash</div>
                  <code className="code-block hash-wrap" title={walrusArtifact.docHash}>
                    {walrusArtifact.docHash}
                  </code>
                </div>
              </div>
            ) : (
              <p>No Walrus artifact detected.</p>
            )}
          </Card>
          <Card variant="tonal">
            <h4 style={{ marginTop: 0 }}>Status</h4>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <Icon name="ledger-sync" tone="accent" />
              <Tag variant="info">Dual validation</Tag>
            </div>
            <p style={{ color: "var(--color-text-secondary)" }}>We will notify you once both tracks succeed.</p>
          </Card>
        </div>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Button onClick={() => navigate("/app")}>Return to dashboard</Button>
          {isRejected && (
            <Button variant="secondary" onClick={() => navigate("/kyc/review")}>
              Review details
            </Button>
          )}
        </div>
      </Card>
    </section>
  );
}
