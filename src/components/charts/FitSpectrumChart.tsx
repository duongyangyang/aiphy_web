import { BaseLineChart, CHART_COLORS, type LineSeries } from "./BaseLineChart";
import { useT } from "../../i18n/useT";

export interface FitSpectrumPoint {
  /** Giá trị T1 hoặc T2 (ms). */
  valueMs: number;
  intensity: number;
}

interface FitSpectrumChartProps {
  points: FitSpectrumPoint[];
  /** Các đỉnh kỳ vọng (T1/T2 của mẫu). */
  peaks: number[];
  xLabel: string;
  height?: number;
}

/**
 * FitSpectrumChart — phổ phân bố T1/T2 sau fit (Bài 10 & 11).
 * Hiển thị đỉnh tại giá trị T1/T2 của mẫu; hỗn hợp → 2 đỉnh.
 */
export function FitSpectrumChart({ points, peaks, xLabel, height }: FitSpectrumChartProps) {
  const { t } = useT();
  const labels = points.map((p) => p.valueMs.toFixed(0));
  const series: LineSeries[] = [
    { label: t("chart.fitSpectrum"), data: points.map((p) => p.intensity), color: CHART_COLORS.amber, fill: true },
  ];
  return (
    <BaseLineChart
      labels={labels}
      series={series}
      xLabel={xLabel}
      yLabel={t("chart.spectrumAmp")}
      height={height}
      ariaLabel={t("chart.fitSpectrumAria")}
      xMarks={peaks.map((p) => ({ value: p, label: t("chart.peak") }))}
    />
  );
}
