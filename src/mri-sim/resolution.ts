/**
 * mri-sim/resolution — mô phỏng "matrix size" bằng cách cắt bớt k-space.
 *
 * Matrix size (số điểm lấy mẫu trong k-space) quyết định độ phân giải ảnh:
 * càng ít điểm (đặc biệt ở biên = tần số cao) → ảnh càng nhòe, mất chi tiết.
 * Ta forward FFT ảnh gốc, giữ lại khối tâm matrixSize×matrixSize, zero phần
 * còn lại, rồi inverse FFT — đúng bản chất "thu ít k-space".
 *
 * Tái dụng `fft.ts`. N phải là lũy thừa 2.
 */

import { fft2d, fftshiftFlat, ifftshiftFlat } from "./fft";

/**
 * applyMatrixSize — trả ảnh số thực [0,1] sau khi giới hạn k-space
 * theo matrix size. matrixSize === n → không cắt (giữ nguyên ảnh).
 */
export function applyMatrixSize(image2d: number[][], matrixSize: number): number[][] {
  const rows = image2d.length;
  const cols = image2d[0]?.length ?? 0;
  const n = rows;
  if (rows !== cols || (n & (n - 1)) !== 0) {
    // Không vuông/lũy thừa 2 → trả nguyên (không FFT).
    return image2d.map((r) => r.slice());
  }

  // Copy sang phẳng.
  const re = new Float64Array(n * n);
  const im = new Float64Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) re[r * n + c] = image2d[r][c];

  // Forward FFT + shift tâm giữa.
  fft2d(re, im, n, false);
  const reS = fftshiftFlat(re, n);
  const imS = fftshiftFlat(im, n);

  // Giữ khối tâm matrixSize×matrixSize, zero phần còn lại.
  const m = Math.max(1, Math.min(n, Math.round(matrixSize)));
  const lo = Math.max(0, Math.floor((n - m) / 2));
  const hi = Math.min(n - 1, Math.ceil((n + m) / 2) - 1);
  const kept = new Float64Array(n * n);
  const keptIm = new Float64Array(n * n);
  for (let r = lo; r <= hi; r++) {
    for (let c = lo; c <= hi; c++) {
      const i = r * n + c;
      kept[i] = reS[i];
      keptIm[i] = imS[i];
    }
  }

  // Inverse: unshift → FFT nghịch → phần thực.
  const reU = ifftshiftFlat(kept, n);
  const imU = ifftshiftFlat(keptIm, n);
  fft2d(reU, imU, n, true);

  // Chuẩn hoá min→max về [0,1].
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < n * n; i++) {
    const v = reU[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  const out: number[][] = new Array(n);
  for (let r = 0; r < n; r++) {
    const line = new Array(n);
    for (let c = 0; c < n; c++) line[c] = (reU[r * n + c] - min) / range;
    out[r] = line;
  }
  return out;
}
