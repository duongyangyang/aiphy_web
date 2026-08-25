import type { CSSProperties } from "react";
import { useT } from "../../i18n/useT";

interface ProgressRailProps {
  /** Tổng số bước. */
  total: number;
  /** Số bước đã hoàn thành. */
  completed: number;
  /** Chỉ số bước hiện tại (0-based). */
  current: number;
  label?: string;
}

/**
 * ProgressRail — thanh tiến độ dạng ray hiệu chuẩn. Mỗi bài là một mắt xích.
 * Trạng thái: completed (cyan đặc), current (viền amber), pending (mờ).
 */
export function ProgressRail({
  total,
  completed,
  current,
  label,
}: ProgressRailProps) {
  const { t } = useT();
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div style={wrapper}>
      <div style={row}>
        <span style={labelStyle}>{label ?? t("progress.default")}</span>
        <span className="mono" style={percentStyle}>{percent}%</span>
      </div>
      <div style={rail}>
        {Array.from({ length: total }).map((_, i) => {
          const isCompleted = i < completed;
          const isCurrent = i === current;
          return (
            <span
              key={i}
              style={{
                ...seg,
                background: isCompleted
                  ? "var(--color-proton-cyan)"
                  : isCurrent
                    ? "rgba(55,215,232,0.25)"
                    : "rgba(234,246,248,0.08)",
                boxShadow: isCurrent ? "0 0 0 2px var(--color-field-amber)" : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

const wrapper: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-2)",
};

const row: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
};

const labelStyle: CSSProperties = {
  fontFamily: "var(--font-data)",
  fontSize: "0.74rem",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--color-muted)",
};

const percentStyle: CSSProperties = {
  color: "var(--color-proton-cyan)",
  fontSize: "0.85rem",
  fontWeight: 500,
};

const rail: CSSProperties = {
  display: "flex",
  gap: 4,
  height: 8,
  width: "100%",
};

const seg: CSSProperties = {
  flex: 1,
  borderRadius: 999,
  transition: "background 0.2s ease, box-shadow 0.2s ease",
};
