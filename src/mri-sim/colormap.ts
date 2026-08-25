/**
 * mri-sim/colormap — bảng màu (lookup table) cho hậu xử lý ảnh MRI.
 *
 * Mỗi colormap là một LUT cố định 256 mục, sinh MỘT LẦN khi module load (từ
 * các hàm phát sinh từng bước). `applyColormap` chỉ đánh chỉ số → tra O(1),
 * đủ nhanh để đổi màu cả lưới ảnh mỗi khung render mà không tính lại pipeline
 * khử nhiễu.
 *
 * Phạm vi giá trị pixel: 0..255 (byte hiển thị). Trả về [R, G, B] 0..255.
 *
 * Tinh thần từng colormap (không cần chính xác tuyệt đối):
 *  • grayscale — xám thường: v → (v, v, v).
 *  • hot       — đen → đỏ → vàng → trắng.
 *  • jet       — xanh dương → xanh lá → vàng → đỏ.
 *  • bone      — xám ngả xanh nhạt (cool blue-tinted gray).
 *
 * Không dùng ký tự Unicode toán học — mọi công thức viết thẳng bằng mã ASCII.
 */
export type ColormapName = "grayscale" | "hot" | "jet" | "bone";

/** Danh sách colormap theo thứ tự hiển thị trong dropdown. */
export const COLORMAPS: ColormapName[] = ["grayscale", "hot", "jet", "bone"];

/** Nhãn tiếng Việt cho dropdown (gọi tên bảng màu chuẩn hậu xử lý ảnh y tế). */
export const COLORMAP_LABELS: Record<ColormapName, string> = {
  grayscale: "Grayscale",
  hot: "Hot / Iron",
  jet: "Jet",
  bone: "Bone",
};

type RGB = [number, number, number];
type RGB01 = [number, number, number]; // kênh 0..1 (trước khi scale ra byte)

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
const clampByte = (v: number): number => (v < 0 ? 0 : v > 255 ? 255 : v);

/** Phát sinh grayscale: v → (v, v, v). */
function grayscaleFn(t: number): RGB01 {
  return [t, t, t];
}

/** Phát sinh hot: 3 đoạn dốc — đỏ, rồi xanh lá, rồi xanh dương. */
function hotFn(t: number): RGB01 {
  const r = t <= 1 / 3 ? t * 3 : 1;
  const g = t <= 1 / 3 ? 0 : t <= 2 / 3 ? (t - 1 / 3) * 3 : 1;
  const b = t <= 2 / 3 ? 0 : (t - 2 / 3) * 3;
  return [r, g, b];
}

/** Phát sinh jet: các tam giác đặt đỉnh ở các pha 0.25 / 0.5 / 0.75. */
function jetFn(t: number): RGB01 {
  const r = clamp01(1.5 - Math.abs(4 * t - 3));
  const g = clamp01(1.5 - Math.abs(4 * t - 2));
  const b = clamp01(1.5 - Math.abs(4 * t - 1));
  return [r, g, b];
}

/** Phát sinh bone: xám với kênh xanh dương nhấc lên nhẹ (cool tint). */
function boneFn(t: number): RGB01 {
  const r = t;
  const g = t;
  const b = Math.min(1, t * 1.05 + 0.05);
  return [r, g, b];
}

/** Dựng LUT 256 byte từ một hàm phát sinh (tính một lần khi load). */
function buildLUT(fn: (t: number) => RGB01): RGB[] {
  const lut: RGB[] = new Array(256);
  for (let i = 0; i < 256; i++) {
    const [r, g, b] = fn(i / 255);
    lut[i] = [
      clampByte(Math.round(r * 255)),
      clampByte(Math.round(g * 255)),
      clampByte(Math.round(b * 255)),
    ];
  }
  return lut;
}

/** Bảng LUT cố định, dựng sẵn khi module được import. */
const LUTS: Record<ColormapName, RGB[]> = {
  grayscale: buildLUT(grayscaleFn),
  hot: buildLUT(hotFn),
  jet: buildLUT(jetFn),
  bone: buildLUT(boneFn),
};

/**
 * applyColormap — tra [R,G,B] 0..255 cho một giá trị pixel 0..255 theo colormap.
 * Dùng LUT cố định (đã dựng sẵn), không tính lại → gọi mỗi pixel khi vẽ OK.
 */
export function applyColormap(pixelValue: number, name: ColormapName): RGB {
  const i = pixelValue < 0 ? 0 : pixelValue > 255 ? 255 : Math.round(pixelValue);
  return LUTS[name][i];
}
