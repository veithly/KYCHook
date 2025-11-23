import logoAsset from "../assets/logo-kychook.svg";

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function Logo({ size = 40, showWordmark = false, className = "" }: LogoProps) {
  return (
    <div className={`logo-container ${className}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <img
        src={logoAsset}
        alt="KYCHook logo"
        width={size}
        height={size}
        style={{ display: "block", width: size, height: size }}
      />

      {showWordmark && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            className="text-display"
            style={{
              fontWeight: 800,
              fontSize: `${size * 0.5}px`,
              color: "var(--color-text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            KYCHook
          </span>
        </div>
      )}
    </div>
  );
}
