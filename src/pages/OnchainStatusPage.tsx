import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSuiClient } from "@mysten/dapp-kit";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Icon } from "../components/Icon";
import { Tag } from "../components/Tag";
import { BADGE_ART_LIBRARY, ONCHAIN_IDS } from "../constants";
import { useAppState } from "../state/AppState";
import { fetchOnchainKycStatus } from "../services/onchainStatus";
import type { DevInspectClient } from "../services/onchainStatus";

export function OnchainStatusPage() {
  const { kyc, onchain, walrusArtifact, proofArtifact, wallet } = useAppState();
  const navigate = useNavigate();
  const client = useSuiClient();

  const devInspectClient = client as unknown as DevInspectClient;

  const { data: chainStatus } = useQuery({
    queryKey: ["kyc-status", wallet.address],
    queryFn: () => fetchOnchainKycStatus(devInspectClient, wallet.address ?? ""),
    enabled: Boolean(wallet.address),
    refetchInterval: 15000,
  });

  const verified = (chainStatus?.kycLevel ?? kyc.level) !== undefined && kyc.stage === "onchain";
  const badgeArt = chainStatus
    ? BADGE_ART_LIBRARY.find((preset) => preset.cid === chainStatus.cardArtCid) ?? BADGE_ART_LIBRARY[0]
    : BADGE_ART_LIBRARY[0];

  return (
    <section className="page-container" style={{ paddingTop: "2rem" }}>
      <div className="bg-onchain">
         <div className="grid-two">
          <Card variant="glass">
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
              <div className="icon-wrapper-lg glow-accent">
                <Icon name="shield-check" tone="accent" size={32} />
              </div>
              <div>
                <h2 style={{ margin: 0 }}>On-chain credential</h2>
                <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>Proof minted via KycRegistry.</p>
              </div>
              <Tag variant={verified ? "success" : "info"} style={{ marginLeft: "auto" }}>
                {verified ? "Verified" : "Pending"}
              </Tag>
            </div>
            <table className="table-status" style={{ marginTop: "1.5rem" }}>
              <tbody>
                <tr className="hover-row">
                  <th>Level</th>
                  <td>
                      <span className="mono-pill highlight">L{chainStatus?.kycLevel ?? kyc.level}</span>
                  </td>
                </tr>
                <tr className="hover-row">
                  <th>Transaction</th>
                  <td>
                      <a href={`https://suiscan.xyz/testnet/tx/${onchain.txHash}`} target="_blank" rel="noreferrer" className="link-external">
                          {onchain.txHash ? `${onchain.txHash.slice(0, 8)}...${onchain.txHash.slice(-8)}` : "Not yet submitted"}
                          {onchain.txHash && <Icon name="arrow-up-right" size={14} />}
                      </a>
                  </td>
                </tr>
                <tr className="hover-row">
                  <th>Last updated</th>
                  <td>
                    {chainStatus?.issuedAt
                      ? new Date(chainStatus.issuedAt).toLocaleString()
                      : kyc.lastUpdated
                        ? new Date(kyc.lastUpdated).toLocaleString()
                        : "Pending"}
                  </td>
                </tr>
                <tr className="hover-row">
                  <th>doc_hash</th>
                  <td>
                    <code
                      className="code-block hash-wrap"
                      title={chainStatus?.docHash ?? walrusArtifact?.docHash ?? undefined}
                    >
                      {chainStatus?.docHash ?? walrusArtifact?.docHash ?? "Pending"}
                    </code>
                  </td>
                </tr>
                <tr className="hover-row">
                  <th>walrus object</th>
                  <td>
                    <code
                      className="code-block hash-wrap"
                      title={
                        chainStatus?.blobId ?? walrusArtifact?.blobObjectId ?? walrusArtifact?.blobId ?? undefined
                      }
                    >
                      {chainStatus?.blobId ?? walrusArtifact?.blobObjectId ?? walrusArtifact?.blobId ?? "Pending"}
                    </code>
                  </td>
                </tr>
                <tr className="hover-row">
                  <th>TEE measurement</th>
                  <td>
                    <code
                      className="code-block hash-wrap"
                      title={chainStatus?.teeMeasurement ?? proofArtifact?.response.data.teeMeasurement ?? undefined}
                    >
                      {chainStatus?.teeMeasurement ?? proofArtifact?.response.data.teeMeasurement ?? "Pending"}
                    </code>
                  </td>
                </tr>
                <tr className="hover-row">
                  <th>Registry</th>
                  <td>
                    <code className="code-block hash-wrap" title={ONCHAIN_IDS.kycRegistryId}>
                      {ONCHAIN_IDS.kycRegistryId}
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
              <Button onClick={() => navigate("/app")} variant="glow">Back to dashboard</Button>
              <Button variant="secondary" onClick={() => navigate("/dev/integrate")}>
                Integration guide
              </Button>
            </div>
          </Card>

          <div className="sidebar-stack">
            <Card variant="light">
                <div className="card-header-sm">
                    <h3>Developer Tools</h3>
                </div>
                <p style={{ color: "var(--color-text-dark)", fontSize: "0.9rem" }}>
                Gate your dApp using the registry ID and `has_level` function.
                </p>
                <div className="card-outline copy-block" style={{ marginBottom: "0.5rem" }}>
                    <span className="label-sm">Package ID</span>
                    <code>{ONCHAIN_IDS.kycRegistryId.slice(0, 10)}...</code>
                </div>
                <div className="card-outline code-snippet">
                <Icon name="code-window" tone="accent" size={16}/>
                <code>move::kychook::has_level(addr, 1)</code>
                </div>
            </Card>

            {chainStatus && (
            <div className="badge-visual-grid fade-in-up">
                <Card variant="glass" className="kyc-badge-card interactive-card">
                <div
                    className="kyc-badge-surface"
                    style={{ backgroundImage: badgeArt.gradient, borderColor: badgeArt.accent }}
                >
                    <div className="kyc-badge-header">
                    <span className="mono-pill glass-pill">{chainStatus.providerId}</span>
                    <span className="mono-pill glass-pill">{chainStatus.badgeId ? chainStatus.badgeId.slice(0, 8) : "SBT"}</span>
                    </div>
                    <div className="kyc-badge-body">
                    <p className="badge-eyebrow">Nationality</p>
                    <strong className="badge-value">{chainStatus.nationality || "Not set"}</strong>
                    <div className="badge-divider"></div>
                    <p className="badge-eyebrow">Verification Level</p>
                    <strong className="badge-value highlight-text">L{chainStatus.kycLevel}</strong>
                    </div>
                    <div className="kyc-badge-footer">
                    <Icon name="check-circle" size={16} style={{color: 'white'}} />
                    <span>Secured by Walrus + TEE</span>
                    </div>
                </div>
                <div className="kyc-badge-meta">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h4>{badgeArt.label}</h4>
                        <span className="meta-tag">Soulbound</span>
                    </div>
                    <p>{badgeArt.description}</p>
                </div>
                </Card>
            </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
