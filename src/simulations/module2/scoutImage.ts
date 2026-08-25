import { generatePhantom } from "../../mri-sim/phantom";
import type { ScoutParams } from "../../stores/module2Store";

/**
 * scoutImage — sinh 3 ảnh định vị (scout) grayscale [0,1] cho bước Scout.
 *
 * Ba mặt phẳng của ống nghiệm MRI (Ø 1cm, cao 3cm, 4 ống nhỏ Ø 0.32cm):
 *  - axial:   lát cắt ngang — hình tròn + 4 chấm tròn (dùng phantom trực tiếp)
 *  - sagittal: nhìn nghiêng — hình chữ nhật dọc (3:1) + 2 sọc dọc
 *  - coronal:  nhìn trước — hình chữ nhật dọc (3:1) + 2 sọc dọc (khác seed)
 *
 * Nhiễu: pseudo-noise DETERMINISTIC (hàm sin theo toạ độ + seed mặt phẳng).
 */

export type ScoutPlane = "sagittal" | "coronal" | "axial";

/** Kích thước ảnh scout (vuông). */
export const SCOUT_SIZE = 128;

/** Gain danh định (RG·PRG·DRG) cho độ sáng "chuẩn". */
const NOMINAL_GAIN = 20 * 3 * 3;

/** Seed nhiễu deterministic theo mặt phẳng. */
const PLANE_SEED: Record<ScoutPlane, number> = { sagittal: 11.3, coronal: 27.7, axial: 41.1 };

/** PD của agar và nghiệm (để tạo side view không cần sinh phantom). */
const AGAR_PD = 0.75;
const TUBE_PD = 0.95; // PD trung bình các dung dịch
const T1_AGAR = 1500;
const T1_TUBE = 800; // T1 trung bình

function noiseAt(x: number, y: number, seed: number): number {
  const a = Math.sin((x * 12.9898 + y * 78.233 + seed) * 1.0);
  const b = Math.sin((x * 39.346 + y * 11.135 + seed * 2.1) * 1.0);
  return (a * 0.6 + b * 0.4);
}

/**
 * Sinh ảnh side view (sagittal/coronal) — hình chữ nhật dọc biểu diễn ống
 * nghiệm nhìn từ bên hông. Ống cao 3cm, rộng 1cm, 4 ống nhỏ → 2 sọc dọc.
 */
function generateSideView(plane: "sagittal" | "coronal", params: ScoutParams): number[][] {
  const n = SCOUT_SIZE;
  const gain = (params.rg * params.prg * params.drg) / NOMINAL_GAIN;
  const trFactor = 1 - Math.exp(-params.tr / 900);
  const noiseAmp = 0.05 / Math.max(0.25, gain * (0.4 + 0.6 * trFactor));
  const seed = PLANE_SEED[plane];

  const cx = (n - 1) / 2;
  const tubeW = n * 0.15;
  const tubeH = n * 0.42;
  const innerOff = n * 0.12;
  const innerR = n * 0.025;

  // Sagittal: 2 sọc dọc; Coronal: 2 sọc ngang (nhìn từ góc khác)
  const isVertical = plane === "sagittal";

  const img: number[][] = new Array(n);
  for (let r = 0; r < n; r++) {
    const row = new Array<number>(n);
    const ny = (r / (n - 1)) * 2 - 1;
    for (let c = 0; c < n; c++) {
      const nx = (c / (n - 1)) * 2 - 1;
      const dx = Math.abs(c - cx);
      const dy = Math.abs(r - cx);

      let pd: number;
      let t1: number;
      if (dx > tubeW || dy > tubeH) {
        pd = 0; t1 = 0;
      } else if (isVertical) {
        // 2 sọc dọc (sagittal)
        if ((Math.abs(dx - innerOff) <= innerR || Math.abs(dx + innerOff) <= innerR) && dy <= tubeH) {
          pd = TUBE_PD; t1 = T1_TUBE;
        } else {
          pd = AGAR_PD; t1 = T1_AGAR;
        }
      } else {
        // 2 sọc ngang (coronal)
        if ((Math.abs(dy - innerOff) <= innerR || Math.abs(dy + innerOff) <= innerR) && dx <= tubeW) {
          pd = TUBE_PD; t1 = T1_TUBE;
        } else {
          pd = AGAR_PD; t1 = T1_AGAR;
        }
      }

      const t1Sat = 1 - Math.exp(-params.tr / Math.max(1, t1));
      let v = pd * t1Sat * gain;
      v += noiseAt(nx, ny, seed) * noiseAmp;
      row[c] = Math.max(0, Math.min(1, v));
    }
    img[r] = row;
  }
  return img;
}

/**
 * generateScoutImage — dựng một ảnh scout.
 */
export function generateScoutImage(plane: ScoutPlane, params: ScoutParams): number[][] {
  const n = SCOUT_SIZE;
  const gain = (params.rg * params.prg * params.drg) / NOMINAL_GAIN;
  const trFactor = 1 - Math.exp(-params.tr / 900);
  const noiseAmp = 0.05 / Math.max(0.25, gain * (0.4 + 0.6 * trFactor));
  const seed = PLANE_SEED[plane];

  // Axial: dùng phantom trực tiếp (lát cắt ngang)
  if (plane === "axial") {
    const phantom = generatePhantom({ size: n });
    const img: number[][] = new Array(n);
    for (let r = 0; r < n; r++) {
      const row = new Array<number>(n);
      const ny = (r / (n - 1)) * 2 - 1;
      for (let c = 0; c < n; c++) {
        const nx = (c / (n - 1)) * 2 - 1;
        const cell = phantom[r][c];
        const t1Sat = 1 - Math.exp(-params.tr / Math.max(1, cell.T1));
        let v = cell.PD * t1Sat * gain;
        v += noiseAt(nx, ny, seed) * noiseAmp;
        row[c] = Math.max(0, Math.min(1, v));
      }
      img[r] = row;
    }
    return img;
  }

  // Sagittal / Coronal: side view
  return generateSideView(plane, params);
}

/** Sinh cả 3 mặt phẳng cùng lúc. */
export function generateScoutImages(params: ScoutParams) {
  return {
    sagittal: generateScoutImage("sagittal", params),
    coronal: generateScoutImage("coronal", params),
    axial: generateScoutImage("axial", params),
  };
}
