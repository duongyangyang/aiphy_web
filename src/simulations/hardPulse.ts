/**
 * hardPulse — Bài 5: xác định góc lật xung cứng.
 *
 * Công thức góc lật chuẩn: θ = γ·B1·τ, τ ∝ P1.
 * Biên độ FID ∝ sin(θ)·exp(-t/T2*). Cực đại tại θ=90°, cực tiểu tại θ=180°.
 *
 * Mô phỏng: quy đổi P1 (μs) → θ (độ). Đặt 90° ứng với P1≈15μs, 180°≈30μs.
 */

export interface AmplitudePoint {
  p1: number;
  amplitude: number;
  flipAngleDeg: number;
}

export interface FidPoint {
  tMs: number;
  signal: number;
}

/** Quy đổi P1 (μs) → góc lật (độ). P1=15μs → 90°, P1=30μs → 180°. */
export function flipAngleFromP1(p1Us: number): number {
  return p1Us * 6;
}

/**
 * Đường biên độ tín hiệu FID theo P1 (đường hình sin).
 */
export function amplitudeVsP1(): AmplitudePoint[] {
  const points: AmplitudePoint[] = [];
  for (let p1 = 1; p1 <= 30; p1 += 0.5) {
    const theta = flipAngleFromP1(p1);
    const amplitude = Math.sin((theta * Math.PI) / 180);
    points.push({ p1, amplitude, flipAngleDeg: theta });
  }
  return points;
}

/**
 * Tìm điểm P1 ứng với 90° (cực đại đầu tiên) và 180° (cực tiểu đầu tiên).
 */
export function findFlipMarks(): { p90: number; p180: number } {
  return { p90: 15, p180: 30 };
}

/**
 * FID mẫu cho một P1 cụ thể (dùng trong visualization phụ nếu cần).
 */
export function generateFidForP1(p1Us: number): FidPoint[] {
  const theta = flipAngleFromP1(p1Us);
  const t2starMs = 28;
  const count = 300;
  const durationMs = 60;
  const points: FidPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const tMs = (i / (count - 1)) * durationMs;
    const decay = Math.exp(-tMs / t2starMs);
    const signal = Math.sin((theta * Math.PI) / 180) * decay * Math.cos(2 * Math.PI * 0 * (tMs / 1000));
    points[i] = { tMs, signal };
  }
  return points;
}
