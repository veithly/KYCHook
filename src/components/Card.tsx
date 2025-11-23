import type { HTMLAttributes, ReactNode } from "react";

type CardVariant = "default" | "glass" | "light" | "tonal";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tight?: boolean;
  variant?: CardVariant;
  children: ReactNode;
}

export function Card({ tight, variant = "default", className = "", children, ...rest }: CardProps) {
  const variantClass =
    variant === "glass"
      ? "glass kyc-card-base"
      : variant === "light"
        ? "light-card kyc-card-base"
        : variant === "tonal"
          ? "tonal-card kyc-card-base"
          : "kyc-card kyc-card-base";

  const classes = [variantClass, tight ? "tight" : "", className].filter(Boolean).join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
