/**
 * mri-sim/canvas — vẽ ảnh grayscale [0,1] lên canvas bằng putImageData.
 * Dùng chung cho scan flow + view lại record.
 */

import { applyColormap, type ColormapName } from "./colormap";

const GAMMA = 0.85; // windowing hiển thị, giữ tương đối giữa các mô

export function drawGrayscale(
  canvas: HTMLCanvasElement | null,
  image2d: number[][],
  gamma = GAMMA
): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rows = image2d.length;
  const cols = image2d[0]?.length ?? 0;
  if (cols === 0) return;
  canvas.width = cols;
  canvas.height = rows;
  const img = ctx.createImageData(cols, rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.max(0, Math.min(1, image2d[r][c]));
      const g = Math.round(Math.pow(v, gamma) * 255);
      const idx = (r * cols + c) * 4;
      img.data[idx] = g;
      img.data[idx + 1] = g;
      img.data[idx + 2] = g;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * drawColormapped — như drawGrayscale nhưng áp colormap (LUT) thay vì xám thuần.
 * Dùng cho ảnh Filtered ở bước Image processing: pixel [0,1] → gamma → byte →
 * applyColormap → [R,G,B]. Colormap đổi thì vẽ lại, không tính lại denoise.
 */
export function drawColormapped(
  canvas: HTMLCanvasElement | null,
  image2d: number[][],
  colormap: ColormapName = "grayscale",
  gamma = GAMMA
): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const rows = image2d.length;
  const cols = image2d[0]?.length ?? 0;
  if (cols === 0) return;
  canvas.width = cols;
  canvas.height = rows;
  const img = ctx.createImageData(cols, rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = Math.max(0, Math.min(1, image2d[r][c]));
      const byte = Math.round(Math.pow(v, gamma) * 255);
      const [cr, cg, cb] = applyColormap(byte, colormap);
      const idx = (r * cols + c) * 4;
      img.data[idx] = cr;
      img.data[idx + 1] = cg;
      img.data[idx + 2] = cb;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
