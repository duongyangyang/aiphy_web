import type { Calibration, HiddenGroundTruth } from "../../stores/module2Store";

/**
 * calibrationQuality — chuyển độ lệch giữa input Prescan của người dùng và
 * ground-truth ẩn thành một điểm chất lượng 0..1. Điểm này sẽ ảnh hưởng tới
 * ảnh chụp ở các bước sau (độ nét, artifact).
 *
 *   quality = exp(-k1·o1Error - k2·shimError - k3·rfaError)
 *
 * Trong đó:
 *   o1Error  = |O1_nhập - trueO1|                              [MHz]
 *   shimError= |Gx - trueShim.gx| + |Gy - trueShim.gy|
 *              + |Gz - trueShim.gz|                            [đơn vị shim]
 *   rfaError = |RFA90_nhập - trueRFA90| + |RFA180_nhập - trueRFA180|  [% điểm]
 *
 * ── Lựa chọn k (review) ────────────────────────────────────────────────
 *  k1 = 2.0  /MHz      — O1 lệch 0.25 MHz  → đóng góp 0.50
 *  k2 = 0.4  /shim     — shimError 1.5     → đóng góp 0.60
 *  k3 = 0.05 /%-point  — rfaError 10       → đóng góp 0.50
 *
 * Bảng kịch bản (để người học "cảm" được đáp ứng):
 *  gần đúng   (ΔO1 0.02, shimErr 0.2, rfaErr 1)   → quality ≈ 0.84
 *  lệch nhẹ   (ΔO1 0.10, shimErr 0.8, rfaErr 4)   → quality ≈ 0.49
 *  lệch vừa   (ΔO1 0.25, shimErr 1.5, rfaErr 10)  → quality ≈ 0.20
 *  lệch xa    (ΔO1 0.50, shimErr 3.0, rfaErr 20)  → quality ≈ 0.04
 * → "lệch vừa phải" đã giảm quality rõ rệt, đúng yêu cầu.
 */
export const K1_O1 = 2.0;
export const K2_SHIM = 0.4;
export const K3_RFA = 0.05;

export interface CalibrationErrors {
  o1Error: number;
  shimError: number;
  rfaError90: number;
  rfaError180: number;
  rfaError: number;
  quality: number;
}

export function computeCalibrationErrors(
  input: { o1: number; shimOffsets: { x: number; y: number; z: number }; rfA90: number; rfA180: number },
  truth: HiddenGroundTruth,
): CalibrationErrors {
  const o1Error = Math.abs(input.o1 - truth.trueO1);
  const shimError =
    Math.abs(input.shimOffsets.x - truth.trueShim.gx) +
    Math.abs(input.shimOffsets.y - truth.trueShim.gy) +
    Math.abs(input.shimOffsets.z - truth.trueShim.gz);
  const rfaError90 = Math.abs(input.rfA90 - truth.trueRFA90);
  const rfaError180 = Math.abs(input.rfA180 - truth.trueRFA180);
  const rfaError = rfaError90 + rfaError180;
  const quality = Math.exp(-K1_O1 * o1Error - K2_SHIM * shimError - K3_RFA * rfaError);
  return { o1Error, shimError, rfaError90, rfaError180, rfaError, quality };
}

/** Lấy chất lượng calibration hiện tại (0..1), mặc định 1 nếu chưa prescan. */
export function calibrationQualityOf(c: Calibration | null): number {
  return c ? c.quality : 1;
}
