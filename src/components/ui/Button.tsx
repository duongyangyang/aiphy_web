import clsx from "clsx";
import type { CSSProperties, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const baseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: "var(--radius-sm)",
  fontFamily: "var(--font-body)",
  fontWeight: 500,
  minHeight: 44,
  cursor: "pointer",
  transition: "transform 0.12s ease, filter 0.12s ease, background 0.12s ease",
  border: "none",
  textDecoration: "none",
};

const variantStyle: Record<Variant, CSSProperties> = {
  primary: {
    background: "linear-gradient(180deg, var(--color-proton-cyan), #2bb9c9)",
    color: "#06222b",
  },
  secondary: {
    background: "transparent",
    color: "var(--color-paper)",
    border: "1px solid var(--color-line-strong)",
  },
  ghost: {
    background: "transparent",
    color: "var(--color-proton-cyan)",
    border: "1px solid transparent",
  },
  danger: {
    background: "transparent",
    color: "var(--color-danger-red)",
    border: "1px solid rgba(255,107,107,0.4)",
  },
};

const sizeStyle: Record<Size, CSSProperties> = {
  sm: { padding: "6px 12px", fontSize: "0.82rem" },
  md: { padding: "10px 18px", fontSize: "0.92rem" },
  lg: { padding: "14px 24px", fontSize: "1rem" },
};

/**
 * Button — nút dùng chung. Target tối thiểu 44px cho control cảm ứng.
 * Dùng style nội tuyến + clsx cho class phụ để tránh xung đột specificity
 * giữa selector dạng `.section` và phần tử.
 */
export function Button({
  variant = "primary",
  size = "md",
  className,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx("btn", className)}
      style={{ ...baseStyle, ...variantStyle[variant], ...sizeStyle[size], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
