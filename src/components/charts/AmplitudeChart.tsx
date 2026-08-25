import { useMemo } from "react";
import { BaseLineChart, CHART_COLORS, type LineSeries } from "./BaseLineChart";
import { useT } from "../../i18n/useT";
import type { Chart } from "chart.js";

export interface AmplitudePoint {
  p1: number;
  amplitude: number;
  flipAngleDeg: number;
}

interface AmplitudeChartProps {
  points: AmplitudePoint[];
  /** Các điểm mark 90°/180° — index trong mảng points. */
  marks?: { index: number; label: string }[];
  /** P1 hiện tại (μs) — đánh dấu điểm đang chọn lên đường cong. */
  currentP1?: number;
  height?: number;
}

/**
 * AmplitudeChart — biên độ tín hiệu FID theo độ rộng xung P1 (Bài 5).
 * Đường hình sin; đánh dấu điểm cực đại (90°) và cực tiểu (180°).
 *
 * Marker động theo `currentP1`: overlay vẽ crosshair dọc + chấm nổi bật +
 * tooltip nhỏ (P1, góc lật θ, biên độ). KHÔNG đổi dữ liệu đường cong gốc —
 * chỉ thêm lớp highlight; cập nhật mỗi khi `currentP1` đổi qua `redrawKey`.
 */
export function AmplitudeChart({ points, marks, currentP1, height }: AmplitudeChartProps) {
  const { t } = useT();
  const labels = points.map((p) => p.p1.toFixed(0));

  const { curIndex, curPoint } = useMemo(() => {
    if (currentP1 === undefined) return { curIndex: -1, curPoint: null as AmplitudePoint | null };
    let best = Infinity;
    let idx = -1;
    points.forEach((p, i) => {
      const d = Math.abs(p.p1 - currentP1);
      if (d < best) {
        best = d;
        idx = i;
      }
    });
    return { curIndex: idx, curPoint: idx >= 0 ? points[idx] : null };
  }, [points, currentP1]);

  // Chỉ giữ nguyên đường cong gốc.
  const series: LineSeries[] = [
    { label: t("chart.series.amp"), data: points.map((p) => p.amplitude), color: CHART_COLORS.cyan, fill: true },
  ];

  const overlay = (chart: Chart<"line">) => {
    if (curIndex < 0 || !curPoint) return;
    const meta = chart.getDatasetMeta(0);
    const ptEl = meta.data[curIndex];
    if (!ptEl) return;
    const x = ptEl.x;
    const yScale = chart.scales.y;
    if (!yScale) return;
    const ctx = chart.ctx;
    ctx.save();
    // Crosshair dọc từ trục X lên marker.
    ctx.strokeStyle = "rgba(242,184,75,0.7)";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, yScale.top);
    ctx.lineTo(x, yScale.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    // Chấm nổi bật tại (P1, amplitude).
    const y = ptEl.y;
    ctx.fillStyle = "rgba(242,184,75,1)";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(7,17,31,0.9)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Tooltip nhỏ: P1, θ, amplitude.
    const text = `P1=${curPoint.p1} μs | θ=${curPoint.flipAngleDeg.toFixed(0)}° | A=${curPoint.amplitude.toFixed(3)}`;
    ctx.font = "11px 'IBM Plex Mono', monospace";
    const w = ctx.measureText(text).width + 12;
    const h = 20;
    let bx = x + 8;
    if (bx + w > chart.width - 4) bx = x - w - 8;
    let by = y - h - 6;
    if (by < yScale.top + 2) by = y + 6;
    ctx.fillStyle = "rgba(7,17,31,0.92)";
    ctx.strokeStyle = "rgba(242,184,75,0.5)";
    ctx.lineWidth = 1;
    ctx.fillRect(bx, by, w, h);
    ctx.strokeRect(bx, by, w, h);
    ctx.fillStyle = "rgba(234,246,248,0.95)";
    ctx.fillText(text, bx + 6, by + 14);
    ctx.restore();
  };

  const xMarks = marks?.map((m) => ({
    value: points[m.index]?.p1 ?? 0,
    label: m.label,
  }));
  if (curPoint) {
    xMarks?.push({ value: curPoint.p1, label: `P1=${curPoint.p1}` });
  }

  return (
    <BaseLineChart
      labels={labels}
      series={series}
      xLabel={t("chart.p1Axis")}
      yLabel={t("chart.ampSignal")}
      height={height}
      ariaLabel={t("chart.ampByP1Aria")}
      xMarks={xMarks}
      overlay={overlay}
      redrawKey={currentP1}
    />
  );
}
