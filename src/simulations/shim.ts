/**
 * shim — Bài 3: shimming (làm phẳng từ trường).
 *
 * Công thức vật lý chuẩn: 1/T2* = 1/T2 + γ·ΔB0  (không có hệ số /2 — đã sửa).
 * FWHM = 1/(π·T2*).
 *
 * Mô phỏng (theo Phụ lục A): không có ΔB0 thật, chỉ có khoảng cách 3 tham số
 * shim ảo tới điểm tối ưu → dùng hằng số quy đổi k.
 *   1/T2*_sim = 1/T2 + k · distance((gx,gy,gz), optimal)
 */

export interface FidPoint {
  tMs: number;
  signal: number;
}

export interface SpectrumPoint {
  freqHz: number;
  intensity: number;
}

export const SHIM_OPTIMAL = { gx: 0, gy: 0, gz: 0 } as const;
export const T2_BASE_MS = 80; // T2 thuần (ms) khi shim hoàn hảo
export const K_SHIM = 0.0009; // hằng số quy đổi (1/(ms·đơn vị))

/**
 * T2* mô phỏng (ms) theo 3 tham số shim.
 */
export function simulateT2starMs(gx: number, gy: number, gz: number): number {
  const dist = Math.sqrt(gx * gx + gy * gy + gz * gz);
  const invT2star = 1 / T2_BASE_MS + K_SHIM * dist;
  return 1 / invT2star;
}

export function fwhmHz(t2starMs: number): number {
  return 1 / (Math.PI * (t2starMs / 1000));
}

/**
 * FID cho Bài 3 — dùng O1 = 0 (đúng cộng hưởng) để tập trung vào shimming.
 * S(t) = exp(-t/T2*) + noise.
 */
export function generateFid(gx: number, gy: number, gz: number, o1Hz = 0): FidPoint[] {
  const t2star = simulateT2starMs(gx, gy, gz);
  const count = 400;
  const durationMs = 120;
  const points: FidPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const tMs = (i / (count - 1)) * durationMs;
    const tSec = tMs / 1000;
    const decay = Math.exp(-tMs / t2star);
    const osc = Math.cos(2 * Math.PI * o1Hz * tSec);
    const noise = 0.01 * Math.sin(i * 12.9898 + tMs * 0.37);
    points[i] = { tMs, signal: osc * decay + noise };
  }
  return points;
}

/**
 * Phổ Lorentzian: L(f) ∝ T2* / (1 + (2π·T2*·(f-O1))²).
 * Đỉnh tại O1, FWHM = 1/(π·T2*).
 */
export function lorentzianSpectrum(
  gx: number,
  gy: number,
  gz: number,
  o1Hz: number,
  freqRangeHz = 2000,
  count = 200
): SpectrumPoint[] {
  const t2starSec = simulateT2starMs(gx, gy, gz) / 1000;
  const points: SpectrumPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const f = -freqRangeHz + (i / (count - 1)) * 2 * freqRangeHz;
    const denom = 1 + Math.pow(2 * Math.PI * t2starSec * (f - o1Hz), 2);
    points[i] = { freqHz: f, intensity: t2starSec / denom };
  }
  return points;
}

/**
 * Điểm số trò chơi hóa: diện tích tích phân |FID|.
 */
export function fidIntegral(points: FidPoint[]): number {
  let sum = 0;
  for (const p of points) sum += Math.abs(p.signal);
  return sum / points.length;
}
