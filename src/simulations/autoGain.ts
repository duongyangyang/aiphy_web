/**
 * autoGain — Bài 4: điều chỉnh gain tự động.
 *
 * Mô phỏng kỹ thuật số hóa tín hiệu (không phải phương trình Bloch —
 * xem Phụ lục A, Bài 4). V_ADC = clip(G(PRG) · V_FID, ±V_max).
 */

export interface FidPoint {
  tMs: number;
  signal: number;
  clipped: boolean;
}

export const V_MAX = 2048;

/**
 * Hệ số khuếch đại G theo PRG (0..4). PRG càng cao, gain càng lớn.
 */
export function gainFromPRG(prg: number): number {
  // Mapping demo: PRG 0 → 0.3, PRG 4 → ~6
  return 0.3 + prg * 1.4;
}

export function clipSignal(v: number, vmax = V_MAX): { value: number; clipped: boolean } {
  if (v > vmax) return { value: vmax, clipped: true };
  if (v < -vmax) return { value: -vmax, clipped: true };
  return { value: v, clipped: false };
}

/**
 * FID với gain theo PRG. P1 (độ rộng xung 90°) ảnh hưởng biên độ gốc.
 */
export function generateFidWithGain(prg: number, p1Us: number): FidPoint[] {
  const gain = gainFromPRG(prg);
  const t2starMs = 28;
  const count = 400;
  const durationMs = 80;
  // Biên độ gốc tỷ lệ với sin(θ), θ ∝ P1. Đơn giản: amplitude ∝ sin(P1·k).
  const baseAmplitude = Math.sin(p1Us * 0.18) * 600 + 400;
  const points: FidPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const tMs = (i / (count - 1)) * durationMs;
    const decay = Math.exp(-tMs / t2starMs);
    const vFid = baseAmplitude * decay + 6 * Math.sin(i * 3.1);
    const v = vFid * gain;
    const { value, clipped } = clipSignal(v);
    points[i] = { tMs, signal: value, clipped };
  }
  return points;
}

export function isClipping(points: FidPoint[]): boolean {
  return points.some((p) => p.clipped);
}
