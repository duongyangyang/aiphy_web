/**
 * fieldStability — Bài 2: đo cường độ và độ ổn định từ trường.
 *
 * Công thức vật lý (khớp chuẩn, xem Phụ lục A):
 *   f_Larmor = γ · B0      (γ ≈ 42.58 MHz/T cho ^1H)
 *   Độ ổn định (ppm/min) = (Δf / f_Larmor) × 10^6 × (1/Δt)
 *
 * Mô phỏng drift: tần số dịch theo thời gian do nhiễu nhiệt độ, dùng
 * mô hình tuyến tính + nhiễu xác định.
 */

export const GAMMA_MHZ_PER_T = 42.58;

export interface DriftPoint {
  tMin: number;
  freqHz: number;
}

export function computeB0(fLarmorMHz: number): number {
  return fLarmorMHz / GAMMA_MHZ_PER_T;
}

export function computeFLarmorMHz(b0T: number): number {
  return b0T * GAMMA_MHZ_PER_T;
}

/**
 * Độ ổn định từ trường (ppm/phút) cho dịch chuyển Δf (Hz) trong khoảng Δt (phút).
 */
export function ppmPerMin(deltaHz: number, fLarmorHz: number, deltaTMin: number): number {
  if (fLarmorHz === 0 || deltaTMin === 0) return 0;
  return (Math.abs(deltaHz) / Math.abs(fLarmorHz)) * 1e6 * (1 / deltaTMin);
}

/**
 * Dãy tần số theo thời gian khi kéo "Thời gian trôi" 0..30 phút.
 * Drift giả lập ~ vài ppm/phút, cộng thêm dao động nhiệt độ chu kỳ.
 */
export function driftSeries(
  tMaxMin: number,
  fLarmorHz: number,
  driftPpmPerMin = 2.4
): DriftPoint[] {
  const count = 60;
  const points: DriftPoint[] = [];
  for (let i = 0; i < count; i++) {
    const tMin = (i / (count - 1)) * tMaxMin;
    const driftHz = fLarmorHz * driftPpmPerMin * 1e-6 * tMin;
    const wobble = Math.sin(tMin * 0.8) * fLarmorHz * 0.4e-6; // dao động nhiệt độ
    points.push({ tMin, freqHz: fLarmorHz + driftHz + wobble });
  }
  return points;
}

export function totalDriftHz(series: DriftPoint[]): number {
  if (series.length < 2) return 0;
  return series[series.length - 1].freqHz - series[0].freqHz;
}
