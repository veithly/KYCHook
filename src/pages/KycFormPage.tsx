import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon, type IconName } from "../components/Icon";
import { Stepper } from "../components/Stepper";
import { Tag } from "../components/Tag";
import { BADGE_ART_LIBRARY, KYC_STEPS } from "../constants";
import { useAppState } from "../state/AppState";

const FLOW_HIGHLIGHTS: Array<{ icon: IconName; title: string; copy: string }> = [
  {
    icon: "vault",
    title: "Walrus enclave storage",
    copy: "Documents enter Walrus enclaves; only hashed metadata leaves your browser.",
  },
  {
    icon: "chain-link",
    title: "Provider receipt signatures",
    copy: "Providers sign encrypted receipts so downstream teams can verify custody instantly.",
  },
  {
    icon: "chip-tee",
    title: "Nautilus attestation",
    copy: "TEE measurements plus Nautilus proofs confirm verifier code and enclave state.",
  },
  {
    icon: "shield-check",
    title: "Move finalization",
    copy: "You co-sign a Move transaction that links the Walrus blob to the KycRegistry.",
  },
];

export function KycFormPage() {
  const navigate = useNavigate();
  const { kyc, updateKycForm, markFormReady, uploadDocument, walrusArtifact } = useAppState();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setSelectedFile(file.name);
    try {
      await uploadDocument(file);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      setUploadError(message);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!walrusArtifact) {
      setUploadError("Please upload your encrypted document to Walrus before continuing.");
      return;
    }
    markFormReady();
    navigate("/kyc/review");
  };

  return (
    <section className="page-container section-gap">
      <div className="gradient-mesh" />
      <Stepper steps={KYC_STEPS} activeId="form" />
      <div className="grid-two align-start section-gap">
        <Card variant="glass" className="kyc-form-card">
          <form onSubmit={handleSubmit} className="kyc-form">
            <div className="kyc-form-headline responsive-stack">
              <div>
                <h2 className="section-title">Identity details</h2>
                <p className="form-subtitle">
                  Light, high-contrast fields keep the workflow consistent with the new Web3 palette.
                </p>
              </div>
              <Tag variant="info">Encrypted with Walrus</Tag>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Full name</span>
                <input
                  required
                  placeholder="Jane Doe"
                  value={kyc.form.fullName}
                  onChange={(e) => updateKycForm({ fullName: e.target.value })}
                  className="input-modern"
                />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  required
                  placeholder="jane@studio.com"
                  value={kyc.form.email}
                  onChange={(e) => updateKycForm({ email: e.target.value })}
                  className="input-modern"
                />
              </label>
              <label className="form-field">
                <span>Country / Region</span>
                <input
                  required
                  placeholder="United States"
                  value={kyc.form.country}
                  onChange={(e) => updateKycForm({ country: e.target.value })}
                  className="input-modern"
                />
              </label>
              <label className="form-field">
                <span>Document type</span>
                <div className="select-wrapper">
                    <select
                        value={kyc.form.idType}
                        onChange={(e) => updateKycForm({ idType: e.target.value })}
                        className="input-modern"
                    >
                    <option>Passport</option>
                    <option>National ID</option>
                    <option>Driver license</option>
                    </select>
                </div>
              </label>
              <label className="form-field">
                <span>Document number</span>
                <input
                  required
                  placeholder="A00000001"
                  value={kyc.form.idNumber}
                  onChange={(e) => updateKycForm({ idNumber: e.target.value })}
                  className="input-modern"
                />
              </label>
              <label className="form-field form-field--full">
                <span>Walrus CID (optional)</span>
                <input
                  placeholder="bafy..."
                  value={kyc.form.documentCid}
                  onChange={(e) => updateKycForm({ documentCid: e.target.value })}
                  className="input-modern"
                />
              </label>
            </div>

            <div className="form-field form-field--full">
              <p className="form-subtitle">Risk statements</p>
              <div className="checkbox-pills">
                <label className="checkbox-pill hover-lift">
                  <input
                    type="checkbox"
                    checked={kyc.form.pep}
                    onChange={(e) => updateKycForm({ pep: e.target.checked })}
                  />
                  Politically exposed person (PEP)
                </label>
                <label className="checkbox-pill hover-lift">
                  <input
                    type="checkbox"
                    checked={kyc.form.sanctioned}
                    onChange={(e) => updateKycForm({ sanctioned: e.target.checked })}
                  />
                  On sanctions list
                </label>
              </div>
            </div>

            <div className="form-field form-field--full">
              <p className="form-subtitle">Badge design</p>
              <div className="card-art-grid">
                {BADGE_ART_LIBRARY.map((preset) => {
                  const isSelected = kyc.form.cardArtCid === preset.cid;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`card-art-option ${isSelected ? "selected" : ""} hover-scale`}
                      onClick={() => updateKycForm({ cardArtCid: preset.cid })}
                      aria-pressed={isSelected}
                    >
                      <div
                        className="card-art-preview"
                        style={{ backgroundImage: preset.gradient, borderColor: preset.accent }}
                      >
                        <span className="card-art-accent" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <div className="card-art-copy">
                        <strong>{preset.label}</strong>
                        <p>{preset.description}</p>
                      </div>
                      {isSelected && <div className="card-art-checkmark-circle">✓</div>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-field form-field--full">
              <div className="file-upload interactive-card">
                <div className="file-upload-header">
                  <div className="icon-wrapper">
                    <Icon name="document-text" tone="accent" size={24} className="icon-interactive" />
                  </div>
                  <div>
                    <strong>Upload encrypted document</strong>
                    <p className="form-note">Walrus keeps the blob sealed; we retain reference hashes only.</p>
                  </div>
                </div>

                <label className="file-upload-label hover-glow">
                  {uploading ? (
                      <span className="loading-spinner-text">Uploading...</span>
                  ) : (
                      <>
                        <Icon name="cloud-upload" size={20} style={{marginBottom: '0.25rem'}}/>
                        <span>Select Document to Encrypt</span>
                      </>
                  )}
                  <input
                    className="file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    title="Upload your encrypted document"
                    aria-label="Upload encrypted document"
                  />
                </label>

                <p className="form-note" style={{textAlign: 'center'}}>
                  {selectedFile
                      ? <span className="file-selected-tag">{selectedFile}</span>
                      : "Supported formats: PDF, PNG, JPG"}
                </p>
                {walrusArtifact && (
                  <div className="upload-meta fade-in">
                    <div className="meta-item">
                      <strong>blob_id</strong>
                      <code>{walrusArtifact.blobId}</code>
                    </div>
                    <div className="meta-item">
                      <strong>doc_hash</strong>
                      <code>{walrusArtifact.docHash}</code>
                    </div>
                  </div>
                )}
                {uploadError && <p className="form-error shake">{uploadError}</p>}
              </div>
            </div>

            <div className="button-row sticky-footer">
              <Button type="submit" variant="glow" disabled={uploading} className="btn-magnetic btn-full-width">
                Review information
              </Button>
              <p className="form-note">You can still make edits during the review checkpoint.</p>
            </div>
          </form>
        </Card>

        <Card variant="glass" className="flow-card interactive-card sticky-sidebar">
          <div className="flow-card-header">
            <div className="flow-header-content">
              <div className="flow-icon-badge pulse-glow">
                <Icon name="parallel-checks" size={24} style={{ color: 'white' }} className="icon-interactive" />
              </div>
              <div>
                <h3 className="section-title">Parallel validation</h3>
                <p className="form-note">
                  Provider review and Nautilus attestation run simultaneously for faster approvals.
                </p>
              </div>
            </div>
            <Tag variant="info">Nautilus + Walrus</Tag>
          </div>
          <div className="flow-list stagger-list">
            {FLOW_HIGHLIGHTS.map((highlight) => (
              <div key={highlight.title} className="flow-row hover-slide">
                <div className="icon-wrapper-sm">
                    <Icon name={highlight.icon} tone="accent" size={20} className="icon-interactive" />
                </div>
                <div>
                  <h4>{highlight.title}</h4>
                  <p>{highlight.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}
