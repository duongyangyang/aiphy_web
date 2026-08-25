import { BaseLineChart, CHART_COLORS, type LineSeries } from "./BaseLineChart";
import { useT } from "../../i18n/useT";

export interface RecoveryPoint {
  tiMs: number;
  mz: number;
  measured: number | null;
}

interface RecoveryChartProps {
  curve: RecoveryPoint[];
  t1Ms: number;
  height?: number;
}

/**
 * RecoveryChart — đường cong hồi phục Mz theo TI (Bài 10, IR).
 * Đường fit liên tục + điểm đo rời rạc.
 */
export function RecoveryChart({ curve, t1Ms, height }: RecoveryChartProps) {
  const { t } = useT();
  const labels = curve.map((p) => p.tiMs.toFixed(0));
  const series: LineSeries[] = [
    { label: "Mz(TI) fit", data: curve.map((p) => p.mz), color: CHART_COLORS.cyan, fill: false },
    {
      label: t("chart.measuredPoint"),
      data: curve.map((p) => p.measured),
      color: CHART_COLORS.amber,
      pointRadius: 4,
      borderWidth: 0,
      fill: false,
    },
  ];
  return (
    <BaseLineChart
      labels={labels}
      series={series}
      xLabel={t("chart.tiAxis")}
      yLabel="Mz / M0"
      height={height}
      yMin={-1}
      yMax={1}
      ariaLabel={t("chart.recoveryAria")}
      xMarks={[{ value: t1Ms, label: "T1" }]}
    />
  );
}
