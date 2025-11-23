import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link" | "glow";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: IconName;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  fullWidth,
  icon,
  children,
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const baseClasses =
    variant === "glow"
      ? ["glow-btn", fullWidth ? "kyc-btn-block" : ""]
      : variant === "ghost"
        ? ["kyc-btn", "kyc-btn-ghost", fullWidth ? "kyc-btn-block" : ""]
        : variant === "link"
          ? ["kyc-btn", "kyc-btn-link"]
          : ["kyc-btn", `kyc-btn-${variant}`, fullWidth ? "kyc-btn-block" : ""];

  const classes = [...baseClasses, className].filter(Boolean).join(" ");

  return (
    <button className={classes} type={type} {...rest}>
      {icon && <Icon name={icon} size={20} />}
      {children}
    </button>
  );
}
