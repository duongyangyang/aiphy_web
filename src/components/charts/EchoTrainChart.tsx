import { BaseLineChart, CHART_COLORS, type LineSeries } from "./BaseLineChart";
import { useT } from "../../i18n/useT";

export interface EchoPoint {
  index: number;
  mxy: number;
}

interface EchoTrainChartProps {
  points: EchoPoint[];
  t2Ms: number;
  /** TE (ms) để tính trục thời gian n·TE — giúp thấy rõ đổi khi kéo TE. */
  teMs?: number;
  height?: number;
}

/**
 * EchoTrainChart — chuỗi echo suy giảm theo thời gian n·TE (Bài 11, CPMG).
 * Trục X là thời gian (ms) thay vì chỉ số echo, nên đổi TE làm đường cong
 * nén/dãn theo trục thời gian — học sinh thấy rõ slider có tác động.
 */
export function EchoTrainChart({ points, t2Ms, teMs = 0, height }: EchoTrainChartProps) {
  const { t } = useT();
  const labels = points.map((p) => (p.index * teMs).toFixed(0));
  const series: LineSeries[] = [
    { label: "Mxy", data: points.map((p) => p.mxy), color: CHART_COLORS.violet, fill: true },
  ];
  return (
    <BaseLineChart
      labels={labels}
      series={series}
      xLabel={t("chart.timeMs")}
      yLabel="Mxy / M0"
      height={height}
      yMin={0}
      yMax={1}
      ariaLabel={t("chart.echoTrainAria")}
      xMarks={[{ value: t2Ms, label: "T2" }]}
    />
  );
}
