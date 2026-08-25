/**
 * relaxometry — Bài 10 (T1 by IR) & Bài 11 (T2 by CPMG).
 *
 * Công thức lý tưởng hóa (xem Phụ lục A, Bài 10 & 11):
 *   Mz(TI) = M0·[1 - 2·exp(-TI/T1)]
 *   Mxy(n·TE) = M0·exp(-n·TE/T2)
 *
 * Defaults thực đo từ tài liệu: dầu T1=154ms; nước T1=2521ms.
 * Phổ "fit" là phổ tổng hợp (sum Gaussian) có đỉnh tại T1/T2 của mẫu;
 * hỗn hợp → 2 đỉnh.
 */

export type SampleKind = "oil" | "water" | "cuso4" | "mixture";

export interface SampleRelax {
  /** T1 (ms). */
  t1Ms: number;
  /** T2 (ms). */
  t2Ms: number;
  /** Các thành phần (cho phổ đa đỉnh). */
  components: { valueMs: number; weight: number }[];
}

export const RELAX_SAMPLES: Record<SampleKind, SampleRelax> = {
  oil: { t1Ms: 154, t2Ms: 90, components: [{ valueMs: 154, weight: 1 }] },
  water: { t1Ms: 2521, t2Ms: 1200, components: [{ valueMs: 2521, weight: 1 }] },
  cuso4: { t1Ms: 600, t2Ms: 300, components: [{ valueMs: 600, weight: 1 }] },
  mixture: {
    t1Ms: 1100,
    t2Ms: 500,
    components: [
      { valueMs: 154, weight: 0.5 },
      { valueMs: 2521, weight: 0.5 },
    ],
  },
};

export interface RecoveryPoint {
  tiMs: number;
  mz: number;
  measured: number | null;
}

export interface EchoPoint {
  index: number;
  mxy: number;
}

export interface FitSpectrumPoint {
  valueMs: number;
  intensity: number;
}

/**
 * Đường cong hồi phục Mz(TI) cho mẫu (Bài 10).
 * `nti` là số điểm đo rời rạc học sinh chọn — kéo thanh trượt đổi số
 * chấm đo trên đường cong, giúp thấy rõ slider có tác động.
 */
export function recoveryCurve(t1Ms: number, tiMaxMs: number, nti = 6, count = 80): RecoveryPoint[] {
  const points: RecoveryPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const tiMs = (i / (count - 1)) * tiMaxMs;
    const mz = 1 - 2 * Math.exp(-tiMs / t1Ms);
    points[i] = { tiMs, mz, measured: null };
  }
  // Thêm nti điểm đo rời rạc (có nhiễu nhẹ).
  const nMeas = Math.max(2, nti);
  for (let k = 1; k <= nMeas; k++) {
    const tiMs = (k / (nMeas + 1)) * tiMaxMs;
    const mz = 1 - 2 * Math.exp(-tiMs / t1Ms);
    const idx = Math.round((tiMs / tiMaxMs) * (count - 1));
    if (points[idx]) points[idx].measured = mz + 0.02 * Math.sin(tiMs * 0.1);
  }
  return points;
}

/**
 * Chuỗi echo suy giảm (Bài 11).
 */
export function echoTrain(t2Ms: number, teMs: number, ne: number): EchoPoint[] {
  const points: EchoPoint[] = [];
  for (let n = 0; n <= ne; n++) {
    points.push({ index: n, mxy: Math.exp(-(n * teMs) / t2Ms) });
  }
  return points;
}

/**
 * Phổ fit tổng hợp: sum Gaussian tại các thành phần T1 (hoặc T2) của mẫu.
 */
export function fitSpectrum(sample: SampleRelax, kind: "T1" | "T2"): FitSpectrumPoint[] {
  const values = sample.components.map((c) => (kind === "T1" ? c.valueMs : c.valueMs * 0.6));
  const count = 160;
  const maxVal = Math.max(...values) * 2.2;
  const points: FitSpectrumPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    const v = (i / (count - 1)) * maxVal;
    let intensity = 0;
    for (let c = 0; c < sample.components.length; c++) {
      const sigma = values[c] * 0.08;
      intensity += sample.components[c].weight * Math.exp(-Math.pow((v - values[c]) / sigma, 2));
    }
    points[i] = { valueMs: v, intensity };
  }
  return points;
}

export function spectrumPeaks(sample: SampleRelax, kind: "T1" | "T2"): number[] {
  return sample.components.map((c) => (kind === "T1" ? c.valueMs : c.valueMs * 0.6));
}
