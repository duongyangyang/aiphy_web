import type { ReactNode, CSSProperties } from "react";

interface DualChartProps {
  left: ReactNode;
  right: ReactNode;
  leftLabel?: string;
  rightLabel?: string;
}

/**
 * DualChart — wrapper hai đồ thị song song (Bài 3 FID+phổ, Bài 10/11 curve+spectrum).
 * Stack dọc trên mobile (dùng class lab-grid đã có media query).
 */
export function DualChart({ left, right, leftLabel, rightLabel }: DualChartProps) {
  return (
    <div className="lab-grid" style={wrapper}>
      <ChartPane label={leftLabel}>{left}</ChartPane>
      <ChartPane label={rightLabel}>{right}</ChartPane>
    </div>
  );
}

function ChartPane({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div style={pane}>
      {label && <p className="eyebrow">{label}</p>}
      {children}
    </div>
  );
}

const wrapper: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
  gap: "var(--space-4)",
  alignItems: "start",
};

const pane: CSSProperties = {
  display: "grid",
  gap: "var(--space-2)",
};
