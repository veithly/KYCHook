import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import { Tag } from "../components/Tag";
import { KYC_STEPS } from "../constants";
import { useAppState } from "../state/AppState";

export function KycReviewPage() {
  const { kyc, submitForReview, walrusArtifact } = useAppState();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const items = [
    { label: "Full name", value: kyc.form.fullName },
    { label: "Email", value: kyc.form.email },
    { label: "Country", value: kyc.form.country },
    { label: "Document type", value: kyc.form.idType },
    { label: "Document number", value: kyc.form.idNumber },
    { label: "Walrus CID", value: kyc.form.documentCid || walrusArtifact?.blobObjectId || "auto-generated" },
    { label: "PEP", value: kyc.form.pep ? "Yes" : "No" },
    { label: "Sanctioned", value: kyc.form.sanctioned ? "Yes" : "No" },
  ];

  const handleSubmit = () => {
    setError(null);
    if (!walrusArtifact) {
      setError("Please upload your document to Walrus before submitting.");
      return;
    }
    setSubmitting(true);
    navigate("/kyc/pending");
    submitForReview().catch((err) => {
      const message = err instanceof Error ? err.message : "Failed to request proof";
      setError(message);
      setSubmitting(false);
      navigate("/kyc/review");
    });
  };

  return (
    <section className="page-container section-gap">
      <div className="gradient-mesh" />
      <Stepper steps={KYC_STEPS} activeId="review" />
      <div className="grid-two align-start section-gap">
        <Card variant="glass" className="interactive-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 className="section-title">Review payload</h2>
            <Tag variant="info">Provider preview</Tag>
          </div>
          <table className="table-glass stagger-list">
            <tbody>
              {items.map((item) => (
                <tr key={item.label}>
                  <th>{item.label}</th>
                  <td>
                    {typeof item.value === "string" && item.value.length > 28 ? (
                      <code className="code-block hash-wrap" title={item.value}>
                        {item.value}
                      </code>
                    ) : (
                      item.value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {walrusArtifact && (
            <div className="card-outline mt-2">
              <strong className="text-eyebrow">Walrus artifact</strong>
              <p style={{ margin: "0.5rem 0" }}>
                blob_id:{" "}
                <code className="code-block hash-wrap" title={walrusArtifact.blobId}>
                  {walrusArtifact.blobId}
                </code>
              </p>
              <p style={{ margin: 0 }}>
                doc_hash:{" "}
                <code className="code-block hash-wrap" title={walrusArtifact.docHash}>
                  {walrusArtifact.docHash}
                </code>
              </p>
            </div>
          )}
          {error && (
            <p className="form-error" style={{ marginTop: "1rem" }}>{error}</p>
          )}
          <div className="button-row" style={{ marginTop: "2rem" }}>
            <Button onClick={handleSubmit} disabled={submitting} variant="glow" className="btn-magnetic">
              {submitting ? "Submitting..." : "Submit for verification"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/kyc/form")} className="btn-magnetic">
              Edit
            </Button>
          </div>
        </Card>
        <Card variant="glass" className="interactive-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Icon name="parallel-checks" tone="accent" size={32} className="icon-interactive" />
            <div>
              <h3 className="section-title" style={{ fontSize: "1.25rem" }}>Next up</h3>
              <p className="form-note">Provider + Nautilus validate simultaneously.</p>
            </div>
          </div>
          <ol className="spaced-list stagger-list" style={{ marginTop: "1.5rem" }}>
            <li>Provider signs receipt.</li>
            <li>Nautilus TEE seals compute proof.</li>
            <li>We notify you inside the dashboard.</li>
          </ol>
        </Card>
      </div>
    </section>
  );
}
