import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartOptions,
} from "chart.js";
import { CHART_COLORS } from "./BaseLineChart";
import { useT } from "../../i18n/useT";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Filler);

/**
 * ShimmingChart — biểu đồ hội tụ shim cho màn hình Prescan (Niumag NMR V3.0).
 *
 * Khác BaseLineChart (dùng CategoryScale) ở chỗ trục X là LINEAR cố định
 * 0..15 với đúng 5 mốc 0.0 / 3.8 / 7.5 / 11.3 / 15.0 (= bước 3.75). Trục Y
 * tự co giãn theo dữ liệu, tối đa 5 mốc. Tách riêng để không ảnh hưởng các
 * chart của Module 1.
 *
 * `data` là chuỗi giá trị dư shim; index được ánh xạ tuyến tính sang X 0..15.
 */
const X_MAX = 15;
const X_TICKS = [0, 3.75, 7.5, 11.25, 15];

export function ShimmingChart({
  data,
  height = 260,
  ariaLabel,
}: {
  data: number[];
  height?: number;
  ariaLabel?: string;
}) {
  const { t } = useT();
  const aria = ariaLabel ?? t("chart.shimAria");
  const residualLabel = t("chart.shimResidual");
  const residualShort = t("chart.shimResidualShort");
  const points = useMemo(() => {
    const n = data.length;
    if (n === 0) return [];
    return data.map((y, i) => ({ x: n === 1 ? 0 : (i / (n - 1)) * X_MAX, y }));
  }, [data]);

  const chartData = useMemo(
    () => ({
      datasets: [
        {
          label: residualLabel,
          data: points,
          borderColor: CHART_COLORS.cyan,
          backgroundColor: CHART_COLORS.cyanFill,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.18,
          fill: true,
        },
      ],
    }),
    [points, residualLabel]
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      parsing: false,
      interaction: { mode: "nearest", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => `x = ${Number(items[0].parsed.x).toFixed(2)}`,
            label: (ctx) => `${residualShort} = ${Number(ctx.parsed.y).toFixed(4)}`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: X_MAX,
          afterBuildTicks: (axis) => {
            axis.ticks = X_TICKS.map((v) => ({ value: v }));
          },
          ticks: {
            color: CHART_COLORS.faint,
            callback: (v) => Number(v).toFixed(1),
          },
          grid: { color: CHART_COLORS.grid },
        },
        y: {
          ticks: { color: CHART_COLORS.faint, maxTicksLimit: 5 },
          grid: { color: CHART_COLORS.grid },
        },
      },
    }),
    [residualShort]
  );

  return (
    <div style={{ height, position: "relative" }}>
      <Line data={chartData} options={options} aria-label={aria} />
    </div>
  );
}
