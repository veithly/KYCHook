import type { CSSProperties, ReactNode } from "react";

export type TagVariant = "neutral" | "success" | "warning" | "error" | "info";

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Tag({ variant = "neutral", children, style, className = "" }: TagProps) {
  return (
    <span className={`tag tag-${variant} ${className}`.trim()} style={style}>
      {children}
    </span>
  );
}
