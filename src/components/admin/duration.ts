import type { T } from "../../i18n/useT";

/**
 * formatDuration — đổi số giây thành chuỗi dễ đọc.
 *
 * `short: true` dùng cho ô số liệu lớn (vd "12g 34p"); mặc định dùng cho bảng
 * (vd "12g 34p", "45 phút", "12 giây").
 */
export function formatDuration(
  seconds: number,
  t: T["t"],
  opts?: { short?: boolean },
): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) return t("admin.duration.hm", { h, m });
  if (m > 0) return t("admin.duration.m", { m });
  if (opts?.short) return t("admin.duration.s", { s: total });
  return t("admin.duration.s", { s });
}

/** Nhãn ngắn cho module trong biểu đồ. */
export function moduleLabel(module: string): string {
  switch (module) {
    case "module-1":
      return "Module 1";
    case "module-2":
      return "Module 2";
    case "module-3":
      return "Module 3";
    case "module-4":
      return "Module 4";
    default:
      return "—";
  }
}
