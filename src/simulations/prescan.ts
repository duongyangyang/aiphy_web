/**
 * prescan — Bài 7: prescan (tổng hợp quy trình).
 *
 * Không có công thức mới (xem `module1-thiet-ke.md` Bài 7 + Phụ lục A).
 * 3 bước tuần tự: tìm O1 → shim (gx,gy,gz) → xung mềm (RFA).
 * Sau khi cả 3 bước "đạt", mở khóa nút "Chụp ảnh".
 */

export type PrescanStep = "resonance" | "shim" | "softpulse" | "imaging";

export interface PrescanParams {
  o1Hz: number;
  gx: number;
  gy: number;
  gz: number;
  rfaPercent: number;
}

export const PRESCAN_TARGETS = {
  // O1 ≈ 0 Hz = đúng cộng hưởng
  o1TargetHz: 0,
  o1ToleranceHz: 1500,
  // Shim tối ưu tại (0,0,0)
  shimTolerance: 4,
  // RFA cho 90° ≈ 50%
  rfaTarget: 50,
  rfaTolerance: 10,
} as const;

export function isResonanceComplete(p: PrescanParams): boolean {
  return Math.abs(p.o1Hz - PRESCAN_TARGETS.o1TargetHz) <= PRESCAN_TARGETS.o1ToleranceHz;
}

export function isShimComplete(p: PrescanParams): boolean {
  const dist = Math.sqrt(p.gx * p.gx + p.gy * p.gy + p.gz * p.gz);
  return dist <= PRESCAN_TARGETS.shimTolerance;
}

export function isSoftPulseComplete(p: PrescanParams): boolean {
  return Math.abs(p.rfaPercent - PRESCAN_TARGETS.rfaTarget) <= PRESCAN_TARGETS.rfaTolerance;
}

export function completedSteps(p: PrescanParams): PrescanStep[] {
  const done: PrescanStep[] = [];
  if (isResonanceComplete(p)) done.push("resonance");
  if (isShimComplete(p)) done.push("shim");
  if (isSoftPulseComplete(p)) done.push("softpulse");
  if (done.length === 3) done.push("imaging");
  return done;
}

export function canImage(p: PrescanParams): boolean {
  return isResonanceComplete(p) && isShimComplete(p) && isSoftPulseComplete(p);
}
