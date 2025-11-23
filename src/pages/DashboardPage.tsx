import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon, type IconName } from "../components/Icon";
import { Tag, type TagVariant } from "../components/Tag";
import { ONCHAIN_IDS, PROVIDER_METADATA } from "../constants";
import { useAppState, type KycStage } from "../state/AppState";
import { fetchOnchainKycStatus, type DevInspectClient } from "../services/onchainStatus";

function formatAddress(addr: string | undefined | null, length = 4): string {
  if (!addr) return "";
  if (addr.length <= length * 2 + 2) return addr;
  return `${addr.slice(0, length + 2)}...${addr.slice(-length)}`;
}

const stageCopy: Record<KycStage, { label: string; variant: TagVariant; description: string }> = {
  not_started: {
    label: "Not started",
    variant: "neutral",
    description: "Spin up your first KYC credential and anchor it on Sui.",
  },
  collecting: { label: "Collecting", variant: "info", description: "We're ingesting your document set." },
  review: { label: "Review", variant: "info", description: "Confirm the payload before submitting to provider." },
  pending: {
    label: "Pending",
    variant: "warning",
    description: "Provider + Nautilus run parallel checks. Expect ~90 seconds.",
  },
  approved: { label: "Approved", variant: "success", description: "Proof is ready. Submit on-chain to finalize." },
  rejected: { label: "Action required", variant: "error", description: "Please update the dataset and resubmit." },
  onchain: { label: "On-chain", variant: "success", description: "Your credential is anchorable across dApps." },
};

const STAGE_ORDER: KycStage[] = ["not_started", "collecting", "review", "pending", "approved", "onchain"];

const WORKFLOW_STEPS: Array<{
  id: Extract<KycStage, "collecting" | "review" | "pending" | "approved" | "onchain">;
  title: string;
  copy: string;
  icon: IconName;
}> = [
  {
    id: "collecting",
    title: "Collect documents",
    copy: "Upload encrypted evidence and finish the form set.",
    icon: "document-text",
  },
  {
    id: "review",
    title: "Review payload",
    copy: "Confirm Walrus hashes + metadata before sharing with provider.",
    icon: "user-search",
  },
  {
    id: "pending",
    title: "Parallel checks",
    copy: "Provider auditors and Nautilus enclaves run simultaneously.",
    icon: "parallel-checks",
  },
  {
    id: "approved",
    title: "Provider receipt",
    copy: "Signed doc_hash value is ready for on-chain publication.",
    icon: "shield-check",
  },
  {
    id: "onchain",
    title: "Sui credential",
    copy: "Finalize via Move transaction for instant verification in dApps.",
    icon: "chain-link",
  },
];

const recentVerifications = [
  { id: "0xb3a0…45c9", level: "L1", time: "2m ago", status: "Approved" },
  { id: "0x9d20…1181", level: "L1", time: "12m ago", status: "On-chain" },
  { id: "0xaa6c…92ff", level: "L2", time: "34m ago", status: "Pending" },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const { wallet, kyc, connectWallet, walrusArtifact, onchain, proofArtifact } = useAppState();
  const suiClient = useSuiClient();
  const devInspectClient = suiClient as unknown as DevInspectClient;

  const { data: chainStatus } = useQuery({
    queryKey: ["dashboard-kyc-status", wallet.address],
    queryFn: () => fetchOnchainKycStatus(devInspectClient, wallet.address ?? ""),
    enabled: Boolean(wallet.address),
    refetchInterval: 15000,
  });

  const hasBadge = Boolean(chainStatus?.badgeId);
  const derivedStage: KycStage = hasBadge ? "onchain" : kyc.stage;
  const stage = stageCopy[derivedStage];
  const stagePosition = STAGE_ORDER.indexOf(derivedStage);

  const handlePrimary = () => {
    if (!wallet.connected) {
      connectWallet();
      return;
    }
    if (hasBadge) {
      navigate("/onchain/status");
      return;
    }
    if (derivedStage === "not_started") {
      navigate("/kyc/start");
    } else if (derivedStage === "approved") {
      navigate("/onchain/attest");
    } else if (derivedStage === "onchain") {
      navigate("/onchain/status");
    } else if (derivedStage === "pending") {
      navigate("/kyc/pending");
    } else {
      navigate("/kyc/form");
    }
  };

  const primaryLabel =
    !wallet.connected
      ? "Connect wallet"
      : hasBadge
        ? "View credential"
        : kyc.stage === "approved"
          ? "Push proof on-chain"
          : "Continue";

  const heroMetrics = [
    { label: "Stage", value: stage.label, meta: "Lifecycle" },
    {
      label: "KYC level",
      value: chainStatus?.kycLevel ?? kyc.level,
      meta: chainStatus?.kycLevel ? "On-chain level" : "Current access",
    },
    { label: "Badge", value: hasBadge ? "Minted" : "Not found", meta: "SBT" },
  ];

  const heroStatus: Array<{ label: string; value: string; mono?: boolean }> = [
    {
      label: "Wallet",
      value: wallet.connected ? formatAddress(wallet.address) || "Connected" : "Not connected",
      mono: wallet.connected && Boolean(wallet.address),
    },
    {
      label: "Last update",
      value: chainStatus?.issuedAt
        ? new Date(chainStatus.issuedAt).toLocaleString()
        : kyc.lastUpdated
          ? new Date(kyc.lastUpdated).toLocaleString()
          : "Waiting event",
    },
    { label: "Proof", value: hasBadge ? "Published" : proofArtifact ? "Ready to publish" : "Awaiting provider" },
    {
      label: "Walrus blob",
      value: chainStatus?.blobId
        ? formatAddress(chainStatus.blobId, 6)
        : walrusArtifact?.blobId
          ? formatAddress(walrusArtifact.blobId, 6)
          : "Not uploaded",
      mono: Boolean(chainStatus?.blobId || walrusArtifact?.blobId),
    },
  ];

  return (
    <section className="page-container section-gap">
      <div className="gradient-mesh" />
      <Card variant="glass" className="dashboard-hero-glass">
        <div className="dashboard-headline">
          <div className="status-badge-large shine-effect">
            <span className="status-dot pulse-animation"></span>
            <span>Live attestor</span>
          </div>
          <h1 className="dashboard-title text-gradient-primary">KYC command console</h1>
          <p className="form-subtitle max-w-xl">
            Monitor credential lifecycle, Walrus uploads, and Sui transactions from a single, precise workspace.
          </p>
          <div className="badge-stack">
            <span className="pill-badge">Sui native</span>
            <span className="pill-badge">Walrus encrypted</span>
            <span className="pill-badge">Nautilus verified</span>
          </div>
          <div className="responsive-stack dashboard-actions">
            <Button variant="glow" onClick={handlePrimary} className="btn-magnetic btn-lg">
              {primaryLabel}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/dev/integrate")} icon="code-window" className="btn-magnetic btn-lg">
              Developer view
            </Button>
          </div>
          <div className="hero-metrics">
            {heroMetrics.map((metric) => (
              <div className="stat-card interactive-card hover-lift" key={metric.label}>
                <strong className="text-gradient-primary">{metric.value}</strong>
                <span>{metric.label}</span>
                <small>{metric.meta}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-summary">
          <span className="stage-chip glow-border">
            <Icon name="beacon" size={22} className="icon-interactive" tone="accent" />
            {stage.label}
          </span>
          <p className="form-note">{stage.description}</p>
          <div className="status-grid">
            {heroStatus.map((block) => (
              <div className="status-item" key={block.label}>
                <small>{block.label}</small>
                {block.mono ? <span className="mono-pill">{block.value}</span> : <strong>{block.value}</strong>}
              </div>
            ))}
          </div>
          <div className="button-row">
            <Button onClick={handlePrimary} variant="glow" className="btn-magnetic">
              {primaryLabel}
            </Button>
            {derivedStage === "onchain" && (
              <Button variant="secondary" onClick={() => navigate("/kyc/start")} className="btn-magnetic">
                Re-run KYC
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="dashboard-grid">
        <Card variant="glass" className="insight-card interactive-card">
          <div className="insight-heading">
            <div>
              <h3>Lifecycle tracker</h3>
              <p className="form-note">Follow every stage from document intake to Sui credential mint.</p>
            </div>
            <Tag variant={stage.variant}>{stage.label}</Tag>
          </div>
          <div className="flow-list stagger-list">
            {WORKFLOW_STEPS.map((step) => {
              const stepIndex = STAGE_ORDER.indexOf(step.id);
              const completed = stagePosition > stepIndex && stepIndex !== -1;
              const active = stagePosition === stepIndex;
              const badge = completed ? "Complete" : active ? "In progress" : "Waiting";
              const badgeVariant: TagVariant = completed ? "success" : active ? "info" : "neutral";
              return (
                <div className={`flow-row ${active ? 'active-step' : ''}`} key={step.id}>
                  <div className="icon-wrapper-sm">
                    <Icon name={step.icon} size={24} tone="accent" className="icon-interactive" />
                  </div>
                  <div className="flow-row-content">
                    <h4>{step.title}</h4>
                    <p>{step.copy}</p>
                  </div>
                  <Tag variant={badgeVariant}>{badge}</Tag>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="glass" className="insight-card interactive-card">
          <div className="insight-heading">
            <div>
              <h3>Walrus & on-chain sync</h3>
              <p className="form-note">Receipts stay paired so compliance teams can prove custody instantly.</p>
            </div>
          </div>
          <div className="sync-list stagger-list">
            <div className="sync-row hover-bg">
              <span>Registry</span>
              <code className="code-block">{formatAddress(ONCHAIN_IDS.kycRegistryId, 6)}</code>
            </div>
            <div className="sync-row hover-bg">
              <span>Walrus blob</span>
              <code className="code-block">{walrusArtifact?.blobId ? formatAddress(walrusArtifact.blobId, 8) : "Not uploaded"}</code>
            </div>
            <div className="sync-row hover-bg">
              <span>doc_hash</span>
              <code className="code-block">{walrusArtifact?.docHash ? formatAddress(walrusArtifact.docHash, 8) : formatAddress(PROVIDER_METADATA.docHash, 8)}</code>
            </div>
            <div className="sync-row hover-bg">
              <span>Proof</span>
              <Tag variant={proofArtifact ? "success" : "warning"}>
                {proofArtifact ? "Ready" : "Awaiting provider"}
              </Tag>
            </div>
            <div className="sync-row hover-bg">
              <span>Sui tx</span>
              <code className="code-block">{onchain.txHash ? formatAddress(onchain.txHash, 8) : "Not submitted"}</code>
            </div>
          </div>
          <div className="telemetry-note">
            <Icon name="chain-link" tone="accent" className="icon-interactive" />
            <p>
              {onchain.status === "verified"
                ? `Tx ${formatAddress(onchain.txHash, 6)} verified on Sui.`
                : "Submit your proof to mint the credential on-chain."}
            </p>
          </div>
        </Card>
      </div>

      <div className="dashboard-grid">
        <Card variant="glass" className="insight-card log-card interactive-card">
          <div className="insight-heading">
            <h3>Recent verifications</h3>
            <Button variant="ghost" onClick={() => navigate("/dev/integrate")} className="btn-magnetic">
              Export logs
            </Button>
          </div>
          <table className="log-table">
            <tbody className="stagger-list">
              {recentVerifications.map((row) => (
                <tr key={row.id} className="hover-row">
                  <td className="log-cell-id">
                    <div className="log-id-wrapper">
                      <Icon name="orbit-node" tone="accent" className="icon-interactive" />
                      <span className="mono-pill">{row.id}</span>
                    </div>
                  </td>
                  <td>{row.level}</td>
                  <td>{row.time}</td>
                  <td>
                    <Tag variant={row.status === "Approved" ? "success" : row.status === "Pending" ? "warning" : "info"}>
                      {row.status}
                    </Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card variant="glass" className="insight-card telemetry-card interactive-card">
          <div className="insight-heading">
            <h3>Provider telemetry</h3>
            <Tag variant="info">TEE attested</Tag>
          </div>
          <div className="telemetry-grid">
            <div className="card-outline hover-lift">
              <small>TEE measurement</small>
              <p className="telemetry-value">
                <code className="code-block hash-wrap" title={PROVIDER_METADATA.teeMeasurement}>
                  {PROVIDER_METADATA.teeMeasurement}
                </code>
              </p>
            </div>
            <div className="card-outline hover-lift">
              <small>Provider ID</small>
              <p className="telemetry-value">
                <code className="code-block hash-ellipsis" title={PROVIDER_METADATA.providerId}>
                  {PROVIDER_METADATA.providerId}
                </code>
              </p>
            </div>
            <div className="card-outline hover-lift">
              <small>Walrus CID</small>
              <p className="telemetry-value">
                <code
                  className="code-block hash-ellipsis"
                  title={walrusArtifact?.blobObjectId ?? undefined}
                >
                  {walrusArtifact?.blobObjectId ? formatAddress(walrusArtifact.blobObjectId, 6) : "Pending"}
                </code>
              </p>
            </div>
          </div>
          <div className="telemetry-note">
            <Icon name="ledger-sync" tone="accent" className="icon-interactive" />
            <p>
              Dual attestation ensures receipts are available even if a provider is briefly offline or rotating keys.
            </p>
          </div>
        </Card>
      </div>
    </section>
  );
}
