/**
 * fidSignal — mô phỏng FID (Free Induction Decay) cho biểu đồ Prescan.
 *
 * Máy NMR/MRI thật hiển thị FID khi shim: tín hiệu ngang từ hoá lưới sau xung
 * 90 độ, suy giảm theo T2*. Chất lượng hiệu chỉnh đọc trực tiếp trên hình dạng
 * đường này — nên đây là phản hồi vật lý "thật", không phải dao động trang trí.
 *
 *   S(t) = A · exp(-t / T2star) · cos(2π · f · t / W)              (+ nhiễu nhỏ)
 *
 * Đường được lái bằng chính các *error* hiệu chỉnh (đã tính trong
 * calibrationQuality) — nên khi calibrated (mọi error ≈ 0) FID về dạng lý
 * tưởng, khớp với quality cao:
 *
 *  • shimError → T2* (độ đồng nhất trường B0).
 *      1/T2* = 1/T2 + γ·ΔB0, ΔB0 ∝ shimError. shim tốt → T2* dài → đường
 *      PHẲNG, suy giảm chậm; shim kém → tụt nhanh về 0.
 *
 *  • o1Error → tần số off-resonance f. O1 lệch → FID DAO ĐỘNG (đập); O1 đúng
 *      (f≈0) → suy giảm đơn điệu, không dao động.
 *
 *  • rfaError90 → biên độ A. Sai biên độ/độ rộng xung → góc lật lệch 90 độ →
 *      A = cos(Δflip) giảm. flip đúng 90 độ (error=0) → A cực đại = 1.
 *
 * Nhiễu: pseudo-noise DETERMINISTIC (sin theo t, quy ước CLAUDE.md) — không
 * Math.random(), chart không nhấp nháy khi re-render.
 */

/** Cửa sổ thời gian trục X của biểu đồ (khớp ShimmingChart: 0..15). */
export const FID_WINDOW = 15;

/** Độ rộng xung 90 danh định (us). Lệch giá trị này làm góc lật sai. */
export const P90_NOMINAL_US = 8;

/** T2* tối đa (shim hoàn hảo) — đủ dài để đường gần phẳng trong cửa sổ. */
const T2STAR_MAX = 34;
/** shimError → làm ngắn T2*: T2* = T2STAR_MAX / (1 + C_SHIM_T2·shimError). */
const C_SHIM_T2 = 1.1;
/** o1Error (MHz) → số chu kỳ dao động trong cửa sổ. */
const C_O1_CYCLES = 7.0;
/** rfaError (%-point) → độ lệch góc lật (độ) trên mỗi %-point. */
const C_RFA_FLIP_DEG = 0.9;

export interface FidInputs {
  o1Error: number; // MHz
  shimError: number; // đơn vị shim (tổng |ΔG|)
  rfaError90: number; // %-point lệch biên độ RF 90
}

/**
 * fidSampleAt — giá trị FID tại thời điểm t (trong [0, FID_WINDOW]).
 */
export function fidSampleAt(t: number, inputs: FidInputs): number {
  const { o1Error, shimError, rfaError90 } = inputs;

  const t2star = T2STAR_MAX / (1 + C_SHIM_T2 * shimError);
  const cycles = C_O1_CYCLES * o1Error; // số chu kỳ off-resonance trong cửa sổ
  const flipErrRad = (C_RFA_FLIP_DEG * rfaError90 * Math.PI) / 180;
  const amp = Math.abs(Math.cos(flipErrRad)); // 1 khi đúng 90 độ

  const envelope = amp * Math.exp(-t / t2star);
  const osc = Math.cos((2 * Math.PI * cycles * t) / FID_WINDOW);

  // Nhiễu deterministic (không Math.random): hai sin lệch pha, biên độ tăng
  // nhẹ theo shimError (shim kém → nền nhiễu rõ hơn).
  const noiseAmp = 0.012 + 0.02 * Math.min(shimError, 3);
  const noise = noiseAmp * (Math.sin(t * 12.9898) * 0.6 + Math.sin(t * 3.71) * 0.4);

  return envelope * osc + noise;
}

/** Sinh trọn đường FID với `samples` điểm đều trên cửa sổ [0, FID_WINDOW]. */
export function generateFidCurve(inputs: FidInputs, samples: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < samples; i++) {
    const t = samples === 1 ? 0 : (i / (samples - 1)) * FID_WINDOW;
    out.push(fidSampleAt(t, inputs));
  }
  return out;
}
