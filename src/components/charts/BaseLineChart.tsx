import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend,
  type ChartOptions,
  type ChartDataset,
  type Point,
  type Plugin,
} from "chart.js";
import { useT } from "../../i18n/useT";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, Legend);

export const CHART_COLORS = {
  cyan: "rgba(55,215,232,0.95)",
  cyanFill: "rgba(55,215,232,0.12)",
  violet: "rgba(139,124,246,0.95)",
  violetFill: "rgba(139,124,246,0.12)",
  amber: "rgba(242,184,75,0.95)",
  amberFill: "rgba(242,184,75,0.12)",
  red: "rgba(255,107,107,0.95)",
  muted: "#8ea7b8",
  faint: "#5c7790",
  grid: "rgba(234,246,248,0.06)",
};

export interface LineSeries {
  label: string;
  data: (number | null)[];
  color?: string;
  fill?: boolean;
  dashed?: boolean;
  pointRadius?: number;
  borderWidth?: number;
}

type LineChart = ChartJS<"line">;
type OverlayFn = (chart: LineChart) => void;

interface BaseLineChartProps {
  labels: string[];
  series: LineSeries[];
  xLabel?: string;
  yLabel?: string;
  height?: number;
  ariaLabel?: string;
  /** Các điểm mark dọc X (vd 90°, 180°) — annotation dạng chip dưới chart. */
  xMarks?: { value: number; label: string }[];
  /** Khoá vùng trục Y (min/max) để đồ thị không auto-scale gây ảo giác "hàm số không đổi". */
  yMin?: number;
  yMax?: number;
  /** Chú thích công thức dưới chart (KaTeX) — thay vì nhúng Unicode/toán vào canvas. */
  caption?: ReactNode;
  /**
   * Lớp vẽ động (crosshair/marker) phủ lên chart. Hàm được lưu trong ref và
   * gọi lại mỗi lần vẽ; dùng kèm `redrawKey` để buộc chart vẽ lại khi cần.
   */
  overlay?: OverlayFn;
  /** Khi giá trị này đổi, buộc chart vẽ lại (để overlay cập nhật). */
  redrawKey?: unknown;
}

/**
 * Overlay plugin ổn định (đăng ký 1 lần). Đọc hàm vẽ mới nhất từ ref — tránh
 * vấn đề react-chartjs-2 không đăng ký lại plugin khi closure đổi.
 */
function useOverlayPlugin(overlay: OverlayFn | undefined) {
  const ref = useRef<OverlayFn | undefined>(overlay);
  ref.current = overlay;
  const plugin = useMemo<Plugin<"line">>(
    () => ({
      id: "baselineOverlay",
      afterDraw: (chart) => {
        ref.current?.(chart as unknown as LineChart);
      },
    }),
    []
  );
  return plugin;
}

/**
 * BaseLineChart — wrapper Chart.js line đồng bộ phong cách buồng lab.
 * Dùng cho FidChart, SpectrumChart, AmplitudeChart, RecoveryChart, EchoTrainChart, FitSpectrumChart.
 */
export function BaseLineChart({
  labels,
  series,
  xLabel,
  yLabel,
  height = 260,
  ariaLabel,
  xMarks,
  yMin,
  yMax,
  caption,
  overlay,
  redrawKey,
}: BaseLineChartProps) {
  const { t } = useT();
  const aria = ariaLabel ?? t("chart.defaultAria");
  const chartRef = useRef<LineChart | null>(null);
  const overlayPlugin = useOverlayPlugin(overlay);

  // Buộc vẽ lại khi redrawKey đổi (overlay đọc giá trị mới nhất).
  useEffect(() => {
    chartRef.current?.render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redrawKey]);

  const data = useMemo(() => {
    const datasets: ChartDataset<"line", (number | Point | null)[]>[] = series.map((s) => {
      const color = s.color ?? CHART_COLORS.cyan;
      const isPoint = (s.pointRadius ?? 0) > 0 && (s.borderWidth ?? 2) === 0;
      return {
        label: s.label,
        data: s.data,
        borderColor: color,
        // Khi không fill, dùng chính màu đường làm backgroundColor để legend
        // HTML tự vẽ swatch đường; chart fill vẫn trong suốt vì fill=false.
        backgroundColor: s.fill ? color.replace("0.95", "0.12") : isPoint ? color : "transparent",
        borderWidth: s.borderWidth ?? 2,
        pointRadius: s.pointRadius ?? 0,
        pointHoverRadius: 4,
        tension: 0.12,
        fill: !!s.fill,
        borderDash: s.dashed ? [6, 6] : undefined,
      };
    });
    return { labels, datasets };
  }, [labels, series]);

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        // Legend vẽ bằng HTML bên ngoài (đường/nét chấm thay vì hộp chữ nhật).
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `${xLabel ?? "x"} = ${items[0].label}`,
            label: (ctx) => `${ctx.dataset.label} = ${(ctx.parsed.y ?? 0).toFixed(4)}`,
          },
        },
      },
      scales: {
        x: {
          title: xLabel ? { display: true, text: xLabel, color: CHART_COLORS.muted } : undefined,
          ticks: { color: CHART_COLORS.faint, maxTicksLimit: 8 },
          grid: { color: CHART_COLORS.grid },
        },
        y: {
          title: yLabel ? { display: true, text: yLabel, color: CHART_COLORS.muted } : undefined,
          ticks: { color: CHART_COLORS.faint },
          grid: { color: CHART_COLORS.grid },
          ...(yMin !== undefined || yMax !== undefined ? { min: yMin, max: yMax } : {}),
        },
      },
    }),
    [xLabel, yLabel, yMin, yMax]
  );

  const plugins = overlay ? [overlayPlugin] : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      {/* Vùng chart có chiều cao cố định — xMarks/caption nằm ngoài để không tràn. */}
      <div style={{ height, position: "relative" }}>
        <Line ref={chartRef} data={data} options={options} plugins={plugins} aria-label={aria} />
      </div>

      {series.length > 1 && (
        <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          {series.map((s, i) => {
            const color = s.color ?? CHART_COLORS.cyan;
            const isPoint = (s.pointRadius ?? 0) > 0 && (s.borderWidth ?? 2) === 0;
            return (
              <span
                key={i}
                className="mono"
                style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.74rem", color: CHART_COLORS.muted }}
              >
                {isPoint ? (
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flex: "0 0 auto" }} />
                ) : (
                  <span
                    style={{
                      width: 22,
                      height: 2,
                      background: color,
                      borderTop: s.dashed ? "2px dotted transparent" : undefined,
                      backgroundImage: s.dashed
                        ? `repeating-linear-gradient(90deg, ${color} 0 4px, transparent 4px 8px)`
                        : undefined,
                      flex: "0 0 auto",
                    }}
                  />
                )}
                {s.label}
              </span>
            );
          })}
        </div>
      )}

      {xMarks && xMarks.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {xMarks.map((m, i) => (
            <span
              key={i}
              className="mono"
              style={{
                fontSize: "0.74rem",
                color: CHART_COLORS.amber,
                border: "1px solid rgba(242,184,75,0.4)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {m.label} @ {m.value}
            </span>
          ))}
        </div>
      )}

      {caption && (
        <div style={{ fontSize: "0.82rem", color: "var(--color-muted)" }}>{caption}</div>
      )}
    </div>
  );
}
