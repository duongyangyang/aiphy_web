/**
 * fid — mô phỏng tín hiệu FID (Bài 1, theo `module1-thiet-ke.md`).
 *
 * Công thức mô phỏng:
 *   S(t) = cos(2π · O1 · t) · exp(-t / T2*) + noise
 *
 * Với O1 = 0 (đúng cộng hưởng), tín hiệu là đường suy giảm đơn điệu không dao động.
 * Với |O1| lớn, tín hiệu dao động nhanh. Nhiễu dùng pseudo-noise deterministic
 * để chart không nhấp nháy khi React re-render.
 *
 * Lưu ý: đây là công thức MÔ PHỎNG (đơn giản hóa cho mục tiêu giáo dục), không
 * phải công thức vật lý gốc đầy đủ — xem Phụ lục A trong tài liệu thiết kế.
 */
import type { LocalizedString } from "../i18n/types";

export type FidState = "far-offset" | "mid-offset" | "near-resonance" | "on-resonance";

export interface FidPoint {
  tMs: number;
  signal: number;
}

export interface FidSimulationInput {
  o1Hz: number;
  durationMs?: number;
  sampleCount?: number;
  t2StarMs?: number;
  noiseLevel?: number;
}

export const FID_DEFAULTS = {
  durationMs: 80,
  sampleCount: 600,
  t2StarMs: 28,
  noiseLevel: 0.015,
} as const;

/**
 * Phân loại trạng thái FID theo độ lệch tần số O1.
 */
export function classifyFidState(o1Hz: number): FidState {
  const abs = Math.abs(o1Hz);
  if (abs >= 30000) return "far-offset";
  if (abs >= 10000) return "mid-offset";
  if (abs > 1000) return "near-resonance";
  return "on-resonance";
}

const STATE_LABELS: Record<FidState, LocalizedString> = {
  "far-offset": {
    vi: "Lệch xa — dao động tần số cao",
    en: "Far off — high-frequency oscillation",
    zh: "偏离较大 — 高频振荡",
  },
  "mid-offset": {
    vi: "Lệch vừa — tín hiệu lệch cộng hưởng",
    en: "Mid off — signal off resonance",
    zh: "偏离中等 — 信号偏离共振",
  },
  "near-resonance": {
    vi: "Lệch gần — tín hiệu gần cộng hưởng",
    en: "Near resonance — signal close to resonance",
    zh: "接近共振 — 信号接近共振",
  },
  "on-resonance": {
    vi: "Đúng cộng hưởng — đường suy giảm đơn điệu",
    en: "On resonance — monotonic decay curve",
    zh: "正好共振 — 单调衰减曲线",
  },
};

export function getFidStateLabel(state: FidState): LocalizedString {
  return STATE_LABELS[state];
}

/**
 * Giải thích động thay đổi theo O1 hiện tại (trả LocalizedString, resolve tại chỗ dùng).
 */
export function getFidExplanation(o1Hz: number): LocalizedString {
  switch (classifyFidState(o1Hz)) {
    case "far-offset":
      return {
        vi: "Tần số phát RF đang lệch xa tần số cộng hưởng, nên tín hiệu FID dao động nhanh. Biên độ bao vẫn suy giảm theo T2*.",
        en: "The RF transmit frequency is far from the resonance frequency, so the FID signal oscillates rapidly. The envelope still decays with T2*.",
        zh: "RF 发射频率偏离共振频率较远，因此 FID 信号快速振荡。包络仍按 T2* 衰减。",
      };
    case "mid-offset":
      return {
        vi: "Bạn đang tiến gần vùng cộng hưởng nhưng tín hiệu vẫn còn dao động rõ.",
        en: "You are approaching the resonance region, but the signal still shows clear oscillation.",
        zh: "你正在接近共振区域，但信号仍有明显振荡。",
      };
    case "near-resonance":
      return {
        vi: "Độ lệch nhỏ làm dao động chậm lại; đường bao suy giảm trở nên dễ quan sát hơn.",
        en: "The small offset slows the oscillation; the decay envelope becomes easier to observe.",
        zh: "偏移很小使振荡变慢；衰减包络更易观察。",
      };
    case "on-resonance":
      return {
        vi: "O1 gần 0 Hz: tín hiệu chủ yếu là đường cong suy giảm theo T2*, không còn dao động lệch tần.",
        en: "O1 is near 0 Hz: the signal is mainly a T2* decay curve, with no residual off-resonance oscillation.",
        zh: "O1 接近 0 Hz：信号主要是按 T2* 衰减的曲线，不再有偏频振荡。",
      };
  }
}

/**
 * Pseudo-noise deterministic — dùng hàm sin bậc thấp để noise ổn định giữa
 * các lần render, tránh chart nhấp nháy.
 */
function pseudoNoise(i: number, tMs: number, level: number): number {
  return level * (Math.sin(i * 12.9898 + tMs * 0.37) * 0.6 + Math.sin(i * 4.1414) * 0.4);
}

/**
 * Sinh chuỗi điểm tín hiệu FID.
 */
export function generateFidSignal(input: FidSimulationInput): FidPoint[] {
  const {
    o1Hz,
    durationMs = FID_DEFAULTS.durationMs,
    sampleCount = FID_DEFAULTS.sampleCount,
    t2StarMs = FID_DEFAULTS.t2StarMs,
    noiseLevel = FID_DEFAULTS.noiseLevel,
  } = input;

  const points: FidPoint[] = new Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const tMs = (i / (sampleCount - 1)) * durationMs;
    const tSec = tMs / 1000;
    const decay = Math.exp(-tMs / t2StarMs);
    // cos(2π · O1 · t) — O1 là độ lệch tần số (Hz).
    const oscillation = Math.cos(2 * Math.PI * o1Hz * tSec);
    const signal = oscillation * decay + pseudoNoise(i, tMs, noiseLevel);
    points[i] = { tMs, signal };
  }
  return points;
}

/**
 * Trình tự quét tự động: tăng O1 theo bước 30000 Hz (theo tài liệu).
 * Dùng cho nút "Quét tự động tìm cộng hưởng".
 */
export const AUTO_SCAN_SEQUENCE: number[] = [-50000, -20000, 10000, 40000, 10000, 0];
