import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { NAV_LINKS } from "../../constants";
import { useAppState } from "../../state/AppState";
import { Button } from "../Button";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { Modal } from "../Modal";
import { Tag } from "../Tag";

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  const { wallet, connectWallet, disconnectWallet, modal, dismissModal } = useAppState();

  return (
    <div>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="logo-stack">
            <Logo size={36} showWordmark />
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Provable identity</span>
          </Link>
          <nav className="nav-links">
            {NAV_LINKS.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <div className="toast-inline">
              <Icon name="beacon" size={18} tone="accent" />
              live attestor
            </div>
            {wallet.connected ? (
              <>
                <Tag variant="info">{wallet.label ?? "Connected"}</Tag>
                <Button variant="ghost" onClick={disconnectWallet}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button variant="glow" onClick={connectWallet}>
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>
      <main>{children}</main>
      {modal && <Modal title={modal.title} message={modal.message} onClose={dismissModal} />}
      <footer className="app-footer">
        <div className="page-container" style={{ paddingTop: "0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <Logo size={32} showWordmark />
              <p style={{ margin: "0.4rem 0 0", color: "var(--color-text-secondary)" }}>
                Provably authentic KYC attestations for the Sui ecosystem.
              </p>
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <Icon name="ledger-sync" size={18} tone="accent" />
                Docs synced: November 15, 2025
              </div>
              <div style={{ marginTop: "0.35rem" }}>Need integration help? → dev@kychook.dev</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
