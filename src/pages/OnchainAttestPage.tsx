import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Tag } from "../components/Tag";
import { ONCHAIN_IDS } from "../constants";
import { useAppState } from "../state/AppState";

export function OnchainAttestPage() {
  const { wallet, onchain, pushProofOnChain, walrusArtifact, proofArtifact } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (onchain.status === "verified") {
      const timer = setTimeout(() => navigate("/onchain/status"), 1200);
      return () => clearTimeout(timer);
    }
  }, [onchain.status, navigate]);

  const disableButton = onchain.status === "submitting" || !proofArtifact?.proofHex || !wallet.connected;

  return (
    <section className="page-container" style={{ paddingTop: "2rem" }}>
      <div className="bg-onchain">
        <div className="grid-two">
          <Card variant="glass">
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Icon name="chain-link" tone="accent" />
              <div>
                <h2 style={{ margin: 0 }}>Push proof on-chain</h2>
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
                  Submit the Move transaction referencing your Walrus blob + Nautilus receipt.
                </p>
              </div>
            </div>
            <table className="table-status" style={{ marginTop: "1rem" }}>
              <tbody>
                <tr>
                  <th>Wallet</th>
                  <td>
                    <code className="code-block hash-wrap" title={wallet.address ?? undefined}>
                      {wallet.address ?? "Connect to continue"}
                    </code>
                  </td>
                </tr>
                <tr>
                  <th>doc_hash</th>
                  <td>
                    <code className="code-block hash-wrap" title={walrusArtifact?.docHash ?? undefined}>
                      {walrusArtifact?.docHash ?? "Upload pending"}
                    </code>
                  </td>
                </tr>
                <tr>
                  <th>walrus_cid</th>
                  <td>
                    <code
                      className="code-block hash-wrap"
                      title={walrusArtifact?.blobObjectId ?? walrusArtifact?.blobId ?? undefined}
                    >
                      {walrusArtifact?.blobObjectId ?? walrusArtifact?.blobId ?? "Upload pending"}
                    </code>
                  </td>
                </tr>
                <tr>
                  <th>TEE measurement</th>
                  <td>
                    <code
                      className="code-block hash-wrap"
                      title={proofArtifact?.response.data.teeMeasurement ?? undefined}
                    >
                      {proofArtifact?.response.data.teeMeasurement ?? "Pending"}
                    </code>
                  </td>
                </tr>
                <tr>
                  <th>Registry</th>
                  <td>
                    <code className="code-block hash-wrap" title={ONCHAIN_IDS.kycRegistryId}>
                      {ONCHAIN_IDS.kycRegistryId}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Button variant="glow" disabled={disableButton} onClick={pushProofOnChain}>
                {onchain.status === "submitting" ? "Submitting..." : "Submit transaction"}
              </Button>
              <Tag variant={onchain.status === "verified" ? "success" : "info"}>
                {onchain.status === "verified" ? "Transaction confirmed" : "Ready to submit"}
              </Tag>
            </div>
          </Card>
          <Card variant="light">
            <h3>Execution summary</h3>
            <p style={{ color: "var(--color-text-dark)" }}>
              We bundle Walrus blob metadata, provider signature, and Nautilus proof into a Move call against the
              registry. Your wallet only needs to sign once.
            </p>
            <div className="card-outline">
              <Icon name="beacon" tone="accent" /> Gas estimate ≈ 0.02 SUI
            </div>
            <div className="card-outline" style={{ marginTop: "0.5rem" }}>
              <Icon name="ledger-sync" tone="accent" /> Submission time ≈ 12s
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
