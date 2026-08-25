import { BaseLineChart, CHART_COLORS, type LineSeries } from "./BaseLineChart";
import { useT } from "../../i18n/useT";

export interface SpectrumPoint {
  freqHz: number;
  intensity: number;
}

interface SpectrumChartProps {
  points: SpectrumPoint[];
  /** Tần số cộng hưởng (đỉnh mong đợi). */
  centerHz?: number;
  height?: number;
  /** Khoá vùng Y để biên độ thay đổi theo RFA nhìn thấy được (Bài 6). */
  yMin?: number;
  yMax?: number;
}

/**
 * SpectrumChart — phổ tần số (Lorentzian hoặc chữ nhật). Dùng cho Bài 3
 * (phổ FID sau Fourier) và Bài 6 (phổ xung mềm).
 */
export function SpectrumChart({ points, centerHz, height, yMin, yMax }: SpectrumChartProps) {
  const { t } = useT();
  const labels = points.map((p) => p.freqHz.toFixed(0));
  const series: LineSeries[] = [
    { label: t("chart.spectrumSeries"), data: points.map((p) => p.intensity), color: CHART_COLORS.violet, fill: true },
  ];
  return (
    <BaseLineChart
      labels={labels}
      series={series}
      xLabel={t("chart.freqHz")}
      yLabel={t("chart.spectrumAmp")}
      height={height}
      ariaLabel={t("chart.spectrumAria")}
      yMin={yMin}
      yMax={yMax}
      xMarks={centerHz !== undefined ? [{ value: centerHz, label: "O1" }] : undefined}
    />
  );
}
