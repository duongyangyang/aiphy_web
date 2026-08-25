import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartOptions,
} from "chart.js";
import type { FidPoint, FidState } from "../../simulations/fid";
import { getFidStateLabel } from "../../simulations/fid";
import { useT } from "../../i18n/useT";
import { formatNumber } from "../../i18n/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface FidChartProps {
  points: FidPoint[];
  state: FidState;
  o1Hz: number;
}

/**
 * FidChart — đồ thị dạng sóng FID realtime.
 * Trục X: thời gian (ms). Trục Y: biên độ tín hiệu. Lưới hiệu chuẩn mảnh.
 * Có summary text để không phụ thuộc màu đơn thuần.
 */
export function FidChart({ points, state, o1Hz }: FidChartProps) {
  const { t, tr, locale } = useT();
  const data = useMemo(
    () => ({
      labels: points.map((p) => p.tMs.toFixed(1)),
      datasets: [
        {
          label: "S(t)",
          data: points.map((p) => p.signal),
          borderColor: "rgba(55,215,232,0.95)",
          backgroundColor: "rgba(55,215,232,0.12)",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          fill: true,
        },
      ],
    }),
    [points]
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `t = ${items[0].label} ms`,
            label: (ctx) => `S(t) = ${(ctx.parsed.y ?? 0).toFixed(4)}`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: t("chart.timeMs"), color: "#8ea7b8" },
          ticks: { color: "#5c7790", maxTicksLimit: 8 },
          grid: { color: "rgba(234,246,248,0.06)" },
        },
        y: {
          title: { display: true, text: t("chart.ampSignal"), color: "#8ea7b8" },
          ticks: { color: "#5c7790" },
          grid: { color: "rgba(234,246,248,0.06)" },
        },
      },
    }),
    [t]
  );

  return (
    <div>
      <div style={{ height: 280, position: "relative" }}>
        <Line data={data} options={options} aria-label={t("chart.fidAria")} />
      </div>
      <SummaryText o1Hz={o1Hz} state={state} />
    </div>
  );

  function SummaryText({ o1Hz, state }: { o1Hz: number; state: FidState }) {
    return (
      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "var(--space-2)",
          marginTop: "var(--space-3)",
        }}
      >
        <Readout label={t("chart.fid.o1Current")} value={`${formatNumber(o1Hz, locale)} Hz`} />
        <Readout label={t("chart.fid.resonanceState")} value={tr(getFidStateLabel(state))} />
        <Readout label={t("chart.fid.t2starSim")} value={`${28} ms`} />
      </dl>
    );
  }

  function Readout({ label, value }: { label: string; value: string }) {
    return (
      <div style={{ padding: "var(--space-2) var(--space-3)", border: "1px solid var(--color-line)", borderRadius: "var(--radius-sm)" }}>
        <dt className="mono" style={{ fontSize: "0.7rem", color: "var(--color-faint)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {label}
        </dt>
        <dd className="mono" style={{ margin: 0, color: "var(--color-paper)", fontSize: "0.9rem", marginTop: 2 }}>
          {value}
        </dd>
      </div>
    );
  }
}
