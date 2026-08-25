import clsx from "clsx";
import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  as?: "div" | "article" | "section" | "a";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onClick?: () => void;
  href?: string;
}

/**
 * Card — bề mặt panel dạng buồng lab: nền lab-panel, lưới hiệu chuẩn mảnh,
 * viền line. Dùng cho module cards, control panel, result panel.
 */
export function Card({
  as: Tag = "div",
  className,
  style,
  children,
  onClick,
  href,
}: CardProps) {
  const computed: CSSProperties = {
    position: "relative",
    background: "var(--color-lab-panel)",
    border: "1px solid var(--color-line)",
    borderRadius: "var(--radius-md)",
    padding: "var(--space-5)",
    boxShadow: "var(--shadow-soft)",
    display: "block",
    ...style,
  };
  if (Tag === "a") {
    return (
      <a href={href} className={clsx("card", "field-grid", className)} style={computed} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Tag className={clsx("card", "field-grid", className)} style={computed} onClick={onClick}>
      {children}
    </Tag>
  );
}
