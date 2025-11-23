import { useNavigate } from "react-router-dom";
import { DEVELOPER_SNIPPETS, VALUE_PROPS } from "../constants";
import { Button } from "../components/Button";
import { Icon } from "../components/Icon";
import { useAppState } from "../state/AppState";
import { IdentityScanner } from "../components/visuals/IdentityScanner";
import { ThreeBackground } from "../components/visuals/ThreeBackground";

// High-end assets config
const SCROLLING_LABELS = ["Sui native", "TEE attested", "Walrus encrypted", "Manual QA", "Audit-ready", "Trusted flows"];

export function LandingPage() {
  const navigate = useNavigate();
  const { wallet, connectWallet } = useAppState();

  const handlePrimaryCta = () => {
    if (!wallet.connected) {
      connectWallet();
    }
    navigate("/app");
  };

  const handleSnippetCopy = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(code);
    }
  };

  return (
    <div className="landing-container">
      {/* 3D Particle Network Background */}
      <ThreeBackground />

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="animate-fluid">
            <span className="text-eyebrow glow-text">The Trust Layer for Sui</span>
            <h1 className="hero-title-xl text-display hero-title-group">
              Verifiable <br />
              <span className="gradient-text">Identity Oracle</span>
            </h1>
          </div>

          <p className="hero-subtitle animate-fluid delay-100 max-w-xl">
            Transform provider-issued KYC checks into composable, privacy-preserving on-chain credentials. Powered by Nautilus TEE & Walrus.
          </p>

          <div className="hero-actions animate-fluid delay-200">
            <Button variant="glow" onClick={handlePrimaryCta} className="btn-magnetic btn-xl">
              {wallet.connected ? "Launch Dashboard" : "Start Verification"}
            </Button>
            <Button variant="secondary" onClick={() => navigate("/dev/integrate")} className="btn-magnetic btn-xl">
              Read Documentation
            </Button>
          </div>

          <div className="badge-stack-container animate-fluid delay-300">
            <div className="glass-panel-pro badge-glass-panel interactive-card hover-lift">
              <div className="icon-wrapper-xs glow-accent">
                <Icon name="shield-check" size={16} tone="accent" className="icon-interactive" />
              </div>
              <span className="badge-glass-label">Audited Contracts</span>
            </div>
            <div className="glass-panel-pro badge-glass-panel interactive-card hover-lift">
               <div className="icon-wrapper-xs glow-accent">
                <Icon name="chip-tee" size={16} tone="accent" className="icon-interactive" />
              </div>
              <span className="badge-glass-label">TEE Protected</span>
            </div>
          </div>
        </div>

        {/* 💎 High-End 3D Glass Visual */}
        <div className="hero-visual-glass">
          <IdentityScanner />
        </div>
      </section>

      {/* Value Props - Glass Cards */}
      <section className="value-section value-section-overlap">
        <div className="value-grid-glass stagger-list">
          {VALUE_PROPS.map((prop, index) => (
            <div
              key={prop.title}
              className={`glass-panel-pro value-card-glass interactive-card hover-glow`}
              style={{ animationDelay: `${0.1 * (index + 2)}s` }}
            >
              <div className="value-icon-glass icon-wrapper-lg">
                <Icon name={prop.icon} size={32} tone="accent" className="icon-interactive" />
              </div>
              <h3 className="text-display">{prop.title}</h3>
              <p>{prop.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Strip */}
      <section className="page-container section-gap">
        <div className="scrolling-badge-row glass-panel-pro no-border">
          <ul className="scroll-track">
            {[...SCROLLING_LABELS, ...SCROLLING_LABELS].map((label, index) => (
              <li key={`${label}-${index}`} className="scroll-item">
                  <Icon name="check-circle" size={16} tone="success" />
                  {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Developer Section */}
      <section className="page-container section-gap dev-section-gap">
        <div className="dev-wrapper-clean overflow-hidden">
          <div className="dev-layout">
            <div className="dev-content">
              <h2 className="dev-intro-title">
                DEVELOPER <span className="text-blue-brand">POWER</span> <br />
                <span className="text-blue-brand">TOOLS</span>
              </h2>
              <p className="dev-intro-text">
                Integrate reusable identity in minutes, not weeks. Our SDK handles the complexity of TEE attestations and Walrus storage.
              </p>

              <div className="workshop-list stagger-list mt-2">
                <div className="workshop-step-clean interactive-card">
                  <div className="step-number">01</div>
                  <div>
                    <h4 className="workshop-step-title">Install SDK</h4>
                    <code className="mono-text workshop-code">npm install @kychook/sdk</code>
                  </div>
                </div>
                <div className="workshop-step-clean interactive-card">
                  <div className="step-number">02</div>
                  <div>
                    <h4 className="workshop-step-title">Verify User</h4>
                    <code className="mono-text workshop-code">await hook.verify(userAddr)</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="dev-snippet-grid stagger-list">
              {DEVELOPER_SNIPPETS.slice(0, 2).map((snippet) => (
                <div key={snippet.label} className="dev-snippet-card-clean interactive-card">
                  <div className="dev-snippet-header">
                    <strong>{snippet.label}</strong>
                    <Button variant="ghost" onClick={() => handleSnippetCopy(snippet.code)} icon="code-window">
                      Copy
                    </Button>
                  </div>
                  <pre className="code-scroll-container dev-snippet-code-box">
                    <code>{snippet.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
