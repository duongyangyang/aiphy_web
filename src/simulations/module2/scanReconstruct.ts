/**
 * scanReconstruct — tái tạo ảnh MRI từ sliceLocation + sequenceParams +
 * calibrationQuality, kèm ground truth. Dùng physics engine sẵn có
 * (phantom + signal + resolution).
 *
 * Các tham số tác động THẬT:
 *  • TR/TE/TI/sequence → tín hiệu mô (spin echo / IR).  (signal.ts)
 *  • matrixSize → cắt k-space → độ phân giải.           (resolution.ts)
 *  • bandwidth → (a) chemical shift: dịch vùng "mỡ" theo chemShiftPixels;
 *    (b) noise *= sqrt(bandwidth/refBandwidth) (BW càng cao → noise càng lớn).
 *  • NEX → noise /= sqrt(NEX); thời gian scan ↑ theo NEX.
 *  • quality (calibration) → noise *= (1 + (1−quality)·K) (calibration kém →
 *    nhiễu/artifact nhiều hơn).
 *
 * Nhiễu deterministic (sin theo toạ độ + seed lát) — không Math.random(), theo
 * quy ước CLAUDE.md.
 */
import { generatePhantom, type Phantom, type TissueType } from "../../mri-sim/phantom";
import { spinEchoSignal, inversionRecoverySignal } from "../../mri-sim/signal";
import { applyMatrixSize } from "../../mri-sim/resolution";
import type { SequenceParams, SliceLocation } from "../../stores/module2Store";

export const SCAN_SIZE = 128; // vuông, lũy thừa 2 để FFT
const REF_BANDWIDTH = 32000; // Hz tham chiếu (noise = 1× tại đây)
const FAT_WATER_HZ = 220; // hiệu số cộng hưởng mỡ-nước @ 1.5T (Hz)
const QUALITY_NOISE_K = 2.5; // calibration kém → nhiễu tăng thêm

/** "Mỡ" = vùng dầu khoáng (solution3) để mô phỏng chemical shift. */
function isFatCell(t: TissueType): boolean {
  return t === "solution3";
}

/**
 * computeGroundTruth — tín hiệu lý tưởng (không noise, không chemical shift),
 * sau khi áp matrixSize. Đây là ảnh "đúng" để so sánh với ảnh tái tạo.
 */
export function computeGroundTruth(seq: SequenceParams, matrixSize: number): number[][] {
  const ph = generatePhantom({ size: SCAN_SIZE });
  const base = isIR(seq)
    ? magnitudeIR(ph, seq.TR, seq.TE, seq.TI ?? 2100)
    : spinEchoSignal(ph, seq.TR, seq.TE);
  return applyMatrixSize(base, matrixSize);
}

/**
 * reconstructScan — ảnh tái tạo (có noise + chemical shift) cho 1 lát.
 * `sliceIndex` dùng làm seed nhiễu để các lát khác nhau vân nhiễu.
 */
export function reconstructScan(
  seq: SequenceParams,
  _loc: SliceLocation,
  quality: number,
  sliceIndex: number,
): { image: number[][]; groundTruth: number[][] } {
  const ph = generatePhantom({ size: SCAN_SIZE });
  const groundTruth = computeGroundTruth(seq, seq.matrixSize);

  // 1) Tín hiệu gốc (có thể mang dấu với IR → lấy magnitude).
  let img = isIR(seq)
    ? magnitudeIR(ph, seq.TR, seq.TE, seq.TI ?? 2100)
    : spinEchoSignal(ph, seq.TR, seq.TE);

  // 2) Chemical shift: dịch vùng "mỡ" chemShiftPixels theo trục read (ngang).
  const bwPerPixel = seq.bandwidth / Math.max(1, seq.matrixSize);
  const chemShiftPixels = FAT_WATER_HZ / Math.max(1, bwPerPixel);
  if (Math.abs(chemShiftPixels) > 0.1) {
    img = shiftFat(img, ph, chemShiftPixels);
  }

  // 3) Áp matrixSize (độ phân giải) lên ảnh có shift.
  img = applyMatrixSize(img, seq.matrixSize);

  // 4) Nhiễu: BW cao → noise lớn; NEX cao → noise nhỏ; quality thấp → noise lớn.
  const bwFactor = Math.sqrt(seq.bandwidth / REF_BANDWIDTH);
  const nexFactor = 1 / Math.sqrt(Math.max(1, seq.nex));
  const qFactor = 1 + (1 - quality) * QUALITY_NOISE_K;
  const noiseAmp = 0.05 * bwFactor * nexFactor * qFactor;

  img = addNoise(img, noiseAmp, sliceIndex);

  // Chuẩn hoá min→max [0,1].
  return { image: normalize01(img), groundTruth };
}

/** Thời gian scan mô phỏng (ms) — tỉ lệ TR·NEX·số lát, có chặn. */
export function scanDurationMs(seq: SequenceParams, sliceCount: number): number {
  const per = Math.max(400, Math.min(4000, seq.TR * 0.6 + 600));
  return Math.min(8000, per * Math.max(1, seq.nex) * Math.max(1, sliceCount));
}

// ── helpers ──────────────────────────────────────────────────────────────

function isIR(seq: SequenceParams): boolean {
  return seq.sequence === "FLAIR";
}

function magnitudeIR(ph: Phantom, tr: number, te: number, ti: number): number[][] {
  const raw = inversionRecoverySignal(ph, tr, te, ti);
  for (let r = 0; r < raw.length; r++)
    for (let c = 0; c < raw[r].length; c++) raw[r][c] = Math.abs(raw[r][c]);
  return raw;
}

/** Dịch các pixel "mỡ" theo trục ngang (read) chemShiftPixels pixel. */
function shiftFat(img: number[][], ph: Phantom, px: number): number[][] {
  const rows = img.length;
  const cols = img[0].length;
  const shift = Math.round(px);
  const out: number[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const line = new Array<number>(cols).fill(0);
    for (let c = 0; c < cols; c++) {
      if (isFatCell(ph[r]?.[c]?.tissueType ?? "background")) {
        const nc = c + shift;
        if (nc >= 0 && nc < cols) line[nc] = img[r][c];
      } else {
        line[c] = img[r][c];
      }
    }
    out[r] = line;
  }
  return out;
}

/** Nhiễu deterministic (sin theo toạ độ + seed lát). */
function addNoise(img: number[][], amp: number, seed: number): number[][] {
  const rows = img.length;
  const cols = img[0].length;
  const out: number[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const line = new Array<number>(cols);
    for (let c = 0; c < cols; c++) {
      const n = amp * (Math.sin((r * 12.9898 + c * 78.233 + seed * 37.1) * 1.0) * 0.6 + Math.sin((r * 39.3 + c * 11.1 + seed * 5.7)) * 0.4);
      line[c] = img[r][c] + n;
    }
    out[r] = line;
  }
  return out;
}

function normalize01(img: number[][]): number[][] {
  let min = Infinity, max = -Infinity;
  for (const row of img) for (const v of row) { if (v < min) min = v; if (v > max) max = v; }
  const range = max - min || 1;
  return img.map((row) => row.map((v) => (v - min) / range));
}

// ── Hậu xử lý ────────────────────────────────────────────────────────────

/**
 * denoiseImage — bộ lọc khử nhiễu "non-local means" rút gọn (patch trung bình
 * trong cửa sổ search × search, trọng số theo độ tương tự patch blockSize).
 * blockSize/searchSize lẻ. Đúng 2 tham số người dùng chỉnh.
 */
export function denoiseImage(img: number[][], blockSize: number, searchSize: number): number[][] {
  const rows = img.length;
  const cols = img[0].length;
  const br = Math.max(1, Math.floor(blockSize / 2));
  const sr = Math.max(1, Math.floor(searchSize / 2));
  const out: number[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    const line = new Array<number>(cols);
    for (let c = 0; c < cols; c++) {
      let sum = 0, wsum = 0;
      for (let dy = -sr; dy <= sr; dy++) {
        for (let dx = -sr; dx <= sr; dx++) {
          const rr = r + dy, cc = c + dx;
          if (rr < 0 || rr >= rows || cc < 0 || cc >= cols) continue;
          // Trọng số = exp(-patchDist/h). patchDist = SSD patch blockSize.
          let d = 0, n = 0;
          for (let py = -br; py <= br; py++) {
            for (let px = -br; px <= br; px++) {
              const a = safe(img, r + py, c + px);
              const b = safe(img, rr + py, cc + px);
              const dd = a - b;
              d += dd * dd;
              n++;
            }
          }
          const dist = d / Math.max(1, n);
          const w = Math.exp(-dist / 0.01);
          sum += w * img[rr][cc];
          wsum += w;
        }
      }
      line[c] = wsum > 0 ? sum / wsum : img[r][c];
    }
    out[r] = line;
  }
  return out;
}

function safe(img: number[][], r: number, c: number): number {
  const rows = img.length, cols = img[0].length;
  const rr = Math.max(0, Math.min(rows - 1, r));
  const cc = Math.max(0, Math.min(cols - 1, c));
  return img[rr][cc];
}

/**
 * windowImage — map pixel [0,1] → [0,1] hiển thị theo WW/WL:
 *   display = clamp((pixel − (WL − WW/2)) / WW, 0, 1)
 * Không đổi dữ liệu gốc.
 */
export function windowImage(img: number[][], ww: number, wl: number): number[][] {
  const lo = wl - ww / 2;
  const range = ww || 1;
  return img.map((row) => row.map((v) => Math.max(0, Math.min(1, (v - lo) / range))));
}
