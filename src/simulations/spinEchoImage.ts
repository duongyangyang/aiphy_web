/**
 * spinEchoImage — Bài 8: FOV và độ phân giải.
 *
 * Công thức (xem `module1-thiet-ke.md` Bài 8 + Phụ lục A):
 *   FOV_x = sw / (γ · G_x)
 *   FOV_y = NE / (γ · G_y · D_y)  (đặc thù EDUMR)
 *
 * Trong bài này, học sinh kéo FOV Read / FOV Phase (mm) và xem ảnh mẫu
 * "phóng to/thu nhỏ". Module này tính bố cục sample cho `MriImageCanvas`.
 */

import type { MriSample } from "../components/charts/MriImageCanvas";

export interface FovInput {
  fovReadMm: number; // FOV theo hướng mã hóa tần số
  fovPhaseMm: number; // FOV theo hướng mã hóa pha
}

/**
 * Bố cục sample chuẩn (oval dầu) tại tâm, kích thước thật ~40mm.
 * FOV hướng được xử lý trong `MriImageCanvas` qua `fovScaleX` (Read, ngang)
 * và `fovScaleY` (Phase, dọc): FOV Read nhỏ → sample rộng ngang; FOV Phase
 * nhỏ → sample cao dọc. Ở đây chỉ trả sample nền với bán kính cố định.
 */
export function sampleLayoutForFov({ fovReadMm, fovPhaseMm }: FovInput): MriSample[] {
  // Giữ tham số để_caption/độ phân giải dùng; bản thân sample không đổi kích thước.
  void fovReadMm;
  void fovPhaseMm;
  return [
    {
      kind: "oil",
      cx: 0.5,
      cy: 0.5,
      radius: 0.42,
      brightness: 0.62,
      label: { vi: "Mẫu dầu", en: "Oil sample", zh: "脂肪样品" },
    },
  ];
}

/**
 * Dùng cho Bài 7: ảnh mẫu dầu oval đơn giản sau khi prescan.
 */
export function prescanSampleImage(): MriSample[] {
  return [
    {
      kind: "oil",
      cx: 0.5,
      cy: 0.5,
      radius: 0.42,
      brightness: 0.62,
      label: { vi: "Mẫu dầu", en: "Oil sample", zh: "脂肪样品" },
    },
  ];
}
