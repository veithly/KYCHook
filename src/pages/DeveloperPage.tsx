import { useState, type ChangeEvent } from "react";
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { DEVELOPER_SNIPPETS, PROVIDER_METADATA, ONCHAIN_IDS } from "../constants";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { Tag } from "../components/Tag";
import { useAppState } from "../state/AppState";
import { buildRegisterProviderTx, buildSetProviderActiveTx } from "../services/providerAdmin";

export function DeveloperPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const { wallet } = useAppState();
  const { mutateAsync: executeTx } = useSignAndExecuteTransaction();
  const [registerForm, setRegisterForm] = useState({
    providerId: "",
    metadataUrl: "",
    enclavePubkeyHex: "",
    teeMeasurementHex: "",
  });
  const [toggleForm, setToggleForm] = useState({ providerId: "", isActive: true });
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCopy = (code: string, label: string) => {
    if (!navigator?.clipboard) {
      setCopied("Clipboard unavailable");
      return;
    }
    navigator.clipboard.writeText(code).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const handleRegister = async () => {
    setAdminMessage(null);
    setAdminError(null);
    if (!wallet.connected) {
      setAdminError("Connect the admin wallet first.");
      return;
    }
    if (!registerForm.providerId || !registerForm.enclavePubkeyHex || !registerForm.teeMeasurementHex) {
      setAdminError("Provider ID, enclave pubkey, and measurement are required.");
      return;
    }
    setSubmitting(true);
    try {
      const serialized = buildRegisterProviderTx(registerForm);
      await executeTx({ transaction: serialized });
      setAdminMessage("Provider registered successfully.");
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async () => {
    setAdminMessage(null);
    setAdminError(null);
    if (!wallet.connected) {
      setAdminError("Connect the admin wallet first.");
      return;
    }
    if (!toggleForm.providerId) {
      setAdminError("Provider ID is required.");
      return;
    }
    setSubmitting(true);
    try {
      const serialized = buildSetProviderActiveTx(toggleForm);
      await executeTx({ transaction: serialized });
      setAdminMessage(`Provider ${toggleForm.providerId} updated.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="page-container dev-page-padding">
      <div className="dev-page-header">
        <Icon name="code-window" size={32} />
        <div>
          <h1 className="dev-page-title">Developer integration</h1>
          <p className="dev-page-subtitle">
            Drop-in method to gate flows by KYC level and surface on-chain metadata.
          </p>
        </div>
      </div>

      {/* Snippet tiles */}
      <div className="dev-layout mb-3">
        {DEVELOPER_SNIPPETS.map((snippet) => (
          <div key={snippet.label} className="dev-snippet-card-clean h-full">
            <div className="dev-snippet-header">
              <div>
                <strong>{snippet.label}</strong>
                <p className="form-subtitle">
                  Ready-to-paste integration block
                </p>
              </div>
              <Button variant="ghost" onClick={() => handleCopy(snippet.code, snippet.label)}>
                {copied === snippet.label ? "Copied" : "Copy code"}
              </Button>
            </div>
            <pre className="dev-snippet-code-box">
              <code>{snippet.code}</code>
            </pre>
          </div>
        ))}
      </div>

      {/* Metadata + Admin split layout */}
      <div className="admin-layout">
        <div className="card-clean">
          <h3 className="mt-0">Registry metadata</h3>
          <p className="form-subtitle">
            Keep these IDs handy when wiring SDK calls or explorer links.
          </p>
          <div className="meta-list-clean">
            <MetaRow label="Move package" value={ONCHAIN_IDS.packageId} pill="testnet" />
            <MetaRow label="KycRegistry object" value={ONCHAIN_IDS.kycRegistryId} />
            <MetaRow label="ProviderRegistry object" value={ONCHAIN_IDS.providerRegistryId} />
            <MetaRow label="Provider ID" value={PROVIDER_METADATA.providerId} />
            <MetaRow label="TEE measurement" value={PROVIDER_METADATA.teeMeasurement} />
            <MetaRow label="Sample Walrus object ID" value={PROVIDER_METADATA.walrusCid} />
          </div>
        </div>

        <div className="card-clean">
          <h3 className="mt-0">Provider admin</h3>
          <p className="form-subtitle">
            Requires the registry admin wallet. Hex fields accept 0x-prefixed or plain values.
          </p>
          <div className="admin-grid">
            <LabeledInput
              label="Provider ID"
              value={registerForm.providerId}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, providerId: e.target.value }))}
            />
            <LabeledInput
              label="Metadata URL"
              value={registerForm.metadataUrl}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, metadataUrl: e.target.value }))}
            />
            <LabeledInput
              label="Enclave pubkey (hex)"
              value={registerForm.enclavePubkeyHex}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, enclavePubkeyHex: e.target.value }))}
            />
            <LabeledInput
              label="TEE measurement (hex)"
              value={registerForm.teeMeasurementHex}
              onChange={(e) => setRegisterForm((prev) => ({ ...prev, teeMeasurementHex: e.target.value }))}
            />
          </div>
          <div className="admin-status-bar-clean">
            <Button onClick={handleRegister} disabled={submitting}>
              {submitting ? "Submitting..." : "Register provider"}
            </Button>
            <div className="admin-toggle-group-clean">
              <input
                placeholder="Provider ID"
                value={toggleForm.providerId}
                onChange={(e) => setToggleForm((prev) => ({ ...prev, providerId: e.target.value }))}
                className="input-dark-clean w-140"
              />
              <label className="checkbox-label-clean">
                <input
                  type="checkbox"
                  checked={toggleForm.isActive}
                  onChange={(e) => setToggleForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Active
              </label>
              <Button variant="secondary" onClick={handleToggle} disabled={submitting} className="btn-sm">
                Update status
              </Button>
            </div>
          </div>
          {adminMessage && <p className="msg-success">{adminMessage}</p>}
          {adminError && <p className="msg-error">{adminError}</p>}
        </div>
      </div>
    </section>
  );
}

type MetaRowProps = { label: string; value: string; pill?: string };

function MetaRow({ label, value, pill }: MetaRowProps) {
  return (
    <div className="meta-row-clean">
      <span className="meta-label-clean">{label}</span>
      <div className="meta-row-content">
        <code className="hash-ellipsis meta-value-clean" title={value}>
          {value}
        </code>
        {pill && (
          <Tag variant="info" className="ml-auto">
            {pill}
          </Tag>
        )}
      </div>
    </div>
  );
}

type LabeledInputProps = {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

function LabeledInput({ label, value, onChange }: LabeledInputProps) {
  return (
    <label className="labeled-input-clean">
      <span>{label}</span>
      <input className="input-clean" value={value} onChange={onChange} />
    </label>
  );
}
