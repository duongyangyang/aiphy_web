import type { ReactNode } from "react";

interface StatusItemProps {
  label: string;
  value: ReactNode;
  tone?: "default" | "amber" | "cyan" | "red";
}

const toneColor: Record<NonNullable<StatusItemProps["tone"]>, string> = {
  default: "var(--color-paper)",
  amber: "var(--color-field-amber)",
  cyan: "var(--color-proton-cyan)",
  red: "var(--color-danger-red)",
};

/**
 * StatusItem — một mục readout trong thanh trạng thái kiểu phần mềm máy.
 */
export function StatusItem({ label, value, tone = "default" }: StatusItemProps) {
  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "baseline" }}>
      <span style={{ color: "var(--color-faint)", fontSize: "0.72rem", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ color: toneColor[tone], fontWeight: 500 }}>{value}</span>
    </span>
  );
}
