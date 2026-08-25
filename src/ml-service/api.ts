/**
 * API client cho Python ML service (port 8788).
 *
 * Tất cả endpoint đều trả về JSON. Frontend dùng fetch với FormData cho
 * file upload (multipart). Xử lý lỗi graceful — khi ML service chưa chạy,
 * trả về thông báo hữu ích thay vì crash.
 */

export interface RecommendParamsInput {
  image: File;
  tr0: number;
  te0: number;
  j0: number;
  method: "argmax" | "soft_argmax" | "quadratic";
  top_k: number;
  temperature: number;
}

export interface RecommendParamsResult {
  TR_star: number;
  TE_star: number;
  J_max: number;
  method: string;
  heatmap_base64: string;
  tr_candidates: number[];
  te_candidates: number[];
  J_grid: number[][];
  tr0: number;
  te0: number;
  j0: number;
  tr_raw: number;
  te_raw: number;
}

export interface SuperResolveResult {
  sr_base64: string;
  uncertainty_base64: string;
  uncertainty_min: number;
  uncertainty_max: number;
  mean_uncertainty: number;
  psnr: number | null;
  ssim: number | null;
  input_shape: [number, number];
  output_shape: [number, number];
}

export interface MlError {
  error: string;
}

const ML_BASE = "/api/ml";

async function request<T>(path: string, body: FormData): Promise<T> {
  const res = await fetch(`${ML_BASE}${path}`, {
    method: "POST",
    body,
    // Không set Content-Type — browser tự set với boundary cho multipart.
  });

  if (!res.ok) {
    const fallback = `Server returned ${res.status}`;
    const text = await res.text().catch(() => fallback);
    let msg = fallback;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed?.error === "string") msg = parsed.error;
      else if (typeof parsed?.detail === "string") msg = parsed.detail;
    } catch {
      // Không parse được JSON — dùng nguyên text.
      if (text.length > 0 && text.length < 300) msg = text;
    }
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

/**
 * Module 3: Dự đoán tham số (TR*, TE*) tối ưu từ ảnh MRI anchor.
 */
export async function recommendParams(
  input: RecommendParamsInput,
): Promise<RecommendParamsResult> {
  const fd = new FormData();
  fd.append("image", input.image);
  fd.append("tr0", String(input.tr0));
  fd.append("te0", String(input.te0));
  fd.append("j0", String(input.j0));
  fd.append("method", input.method);
  fd.append("top_k", String(input.top_k));
  fd.append("temperature", String(input.temperature));

  return request<RecommendParamsResult>("/recommend-params", fd);
}

/**
 * Module 4: Siêu phân giải ảnh MRI (×2).
 */
export async function superResolve(
  image: File,
  hq?: File,
): Promise<SuperResolveResult> {
  const fd = new FormData();
  fd.append("image", image);
  if (hq) fd.append("hq", hq);

  return request<SuperResolveResult>("/super-resolve", fd);
}