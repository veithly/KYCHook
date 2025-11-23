import type { CSSProperties, SVGProps } from "react";

export type IconName =
  | "shield-check"
  | "lock-privacy"
  | "chip-tee"
  | "user-search"
  | "document-text"
  | "chain-link"
  | "wallet"
  | "globe-network"
  | "clock"
  | "alert-triangle"
  | "code-window"
  | "ledger-sync"
  | "parallel-checks"
  | "orbit-node"
  | "beacon"
  | "vault"
  | "check-circle"
  | "cloud-upload"
  | "arrow-up-right";

const paths: Record<IconName, (props: SVGProps<SVGSVGElement>) => JSX.Element> = {
  "shield-check": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 3 4.5 6v5c0 4.66 3 7.77 7.5 9.5 4.5-1.73 7.5-4.84 7.5-9.5V6L12 3Z" />
      <path d="M9.5 12.2 11 13.7l3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "lock-privacy": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x={5} y={11} width={14} height={9} rx={2} />
      <path d="M9 11V8a3 3 0 0 1 6 0v3" />
      <path d="M12 15v2" strokeLinecap="round" />
    </svg>
  ),
  "chip-tee": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x={5} y={5} width={14} height={14} rx={2} />
      <path d="M9 9h6v6H9z" />
      <path d="M12 5V3" />
      <path d="M12 21v-2" />
      <path d="M5 12H3" />
      <path d="M21 12h-2" />
    </svg>
  ),
  "user-search": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={10} cy={8} r={3} />
      <path d="M4 19c0-2.8 2.7-5 6-5" />
      <circle cx={17} cy={17} r={3} />
      <path d="m19.2 19.2 1.6 1.6" strokeLinecap="round" />
    </svg>
  ),
  "document-text": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6" strokeLinecap="round" />
      <path d="M9 16h4" strokeLinecap="round" />
    </svg>
  ),
  "chain-link": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M9.5 14.5 7 17a3 3 0 0 0 4.2 4.2l3.2-3.2" />
      <path d="M14.5 9.5 17 7a3 3 0 0 0-4.2-4.2L9.6 6" />
      <path d="m8 16 8-8" strokeLinecap="round" />
    </svg>
  ),
  "wallet": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x={3} y={6} width={18} height={13} rx={3} />
      <path d="M16 12h2.5v3H16a1.5 1.5 0 0 1 0-3Z" />
      <path d="M3 10h18" />
    </svg>
  ),
  "globe-network": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M3 12h18" />
      <path d="M12 3a17 17 0 0 1 4 9 17 17 0 0 1-4 9 17 17 0 0 1-4-9 17 17 0 0 1 4-9Z" />
    </svg>
  ),
  "clock": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={12} cy={12} r={9} />
      <path d="M12 7v6l3 2" strokeLinecap="round" />
    </svg>
  ),
  "alert-triangle": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="m12 3 9 16H3l9-16Z" />
      <path d="M12 9v4" strokeLinecap="round" />
      <circle cx={12} cy={17} r={0.6} fill="currentColor" />
    </svg>
  ),
  "code-window": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x={3} y={5} width={18} height={14} rx={2} />
      <path d="M3 9h18" />
      <path d="m10 13-2 2 2 2" strokeLinecap="round" />
      <path d="m14 13 2 2-2 2" strokeLinecap="round" />
    </svg>
  ),
  "ledger-sync": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x={3} y={5} width={8} height={14} rx={2} />
      <rect x={13} y={5} width={8} height={14} rx={2} />
      <path d="M6.5 9h1" strokeLinecap="round" />
      <path d="M16.5 9h1" strokeLinecap="round" />
      <path d="M6.5 13h1" strokeLinecap="round" />
      <path d="M16.5 13h1" strokeLinecap="round" />
      <path d="M3 12h-1.5" strokeLinecap="round" />
      <path d="M22.5 12H21" strokeLinecap="round" />
    </svg>
  ),
  "parallel-checks": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M5 6h6" strokeLinecap="round" />
      <path d="M5 12h6" strokeLinecap="round" />
      <path d="M5 18h6" strokeLinecap="round" />
      <path d="M15 6h4l-3 3 3 3h-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12h4l-3 3 3 3h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "orbit-node": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={12} cy={12} r={3} />
      <ellipse cx={12} cy={12} rx={8} ry={4.5} />
      <ellipse cx={12} cy={12} rx={4.5} ry={8} />
      <circle cx={18.5} cy={8} r={0.9} fill="currentColor" />
      <circle cx={5.5} cy={16} r={0.9} fill="currentColor" />
    </svg>
  ),
  "beacon": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <circle cx={12} cy={12} r={3} />
      <path d="M12 5v-2" strokeLinecap="round" />
      <path d="M5 12H3" strokeLinecap="round" />
      <path d="M12 21v-2" strokeLinecap="round" />
      <path d="M21 12h-2" strokeLinecap="round" />
      <circle cx={12} cy={12} r={7} strokeDasharray="2 4" />
    </svg>
  ),
  "vault": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <rect x={4} y={4} width={16} height={16} rx={2} />
      <circle cx={12} cy={12} r={3} />
      <path d="M12 9.5v5" strokeLinecap="round" />
      <path d="M9.5 12h5" strokeLinecap="round" />
      <path d="M4 8h16" />
    </svg>
  ),
  "check-circle": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "cloud-upload": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M12 12v9" strokeLinecap="round" />
      <path d="m16 16-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 16l-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "arrow-up-right": (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} {...props}>
      <path d="M7 17L17 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 7h10v10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  tone?: "default" | "accent" | "warning" | "success";
}

export function Icon({ name, size = 28, tone = "default", style, ...rest }: IconProps) {
  const Element = paths[name];
  // Fallback for missing icon definitions to prevent crashes
  if (!Element) {
    console.warn(`Icon "${name}" not found in Icon library.`);
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{backgroundColor: 'rgba(255,0,0,0.1)', borderRadius: 4}} />;
  }

  const toneColor: Record<NonNullable<IconProps["tone"]>, string | undefined> = {
    default: undefined,
    accent: "var(--color-accent-cyan)",
    warning: "var(--color-accent-warning)",
    success: "var(--color-accent-success)",
  };
  const mergedStyle: CSSProperties | undefined =
    toneColor[tone] || style ? { color: toneColor[tone], ...style } : style;
  return <Element width={size} height={size} style={mergedStyle} {...rest} />;
}
