/**
 * i18n types — mô hình đa ngôn ngữ (Việt / Anh / Trung) cho toàn app.
 *
 * Hai cách biểu diễn nội dung:
 * - Chuỗi UI ngắn (label, nút): tra key trong dictionary `locales/<locale>.ts`.
 * - Nội dung giáo dục có cấu trúc (data files, simulation text): `LocalizedString`,
 *   giữ đồng chỗ với cấu trúc dữ liệu, resolve tại chỗ dùng bằng `tr()`.
 *
 * Quy ước (theo CLAUDE.md): toán học = LaTeX/KaTeX, không dùng ký tự Unicode
 * toán học (γ, ω₀, θ, …) trong mã hay nội dung.
 */

export type Locale = "vi" | "en" | "zh";

/** Chuỗi dịch đủ 3 ngôn ngữ. Dùng cho nội dung có cấu trúc (data files, sim). */
export type LocalizedString = Record<Locale, string>;

export const LOCALE_ORDER: Locale[] = ["vi", "en", "zh"];

export interface LocaleMeta {
  code: Locale;
  /** Nhãn ngắn cho nút switcher. */
  label: string;
  /** Mã cờ emoji. */
  flag: string;
  /** BCP-47 tag cho Intl/toLocaleString và <html lang>. */
  tag: string;
  /** Tên tự xưng bằng chính ngôn ngữ đó (cho aria-label switcher). */
  selfName: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: "vi", label: "VN", flag: "🇻🇳", tag: "vi-VN", selfName: "Tiếng Việt" },
  { code: "en", label: "EN", flag: "🇬🇧", tag: "en-US", selfName: "English" },
  { code: "zh", label: "ZH", flag: "🇨🇳", tag: "zh-CN", selfName: "中文" },
];

export const LOCALE_TAGS: Record<Locale, string> = LOCALES.reduce(
  (acc, l) => {
    acc[l.code] = l.tag;
    return acc;
  },
  {} as Record<Locale, string>,
);

/** BCP-47 tag cho <html lang> (chỉ phần ngôn ngữ). */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  vi: "vi",
  en: "en",
  zh: "zh",
};

const VALID_LOCALES = new Set<Locale>(LOCALE_ORDER);

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && VALID_LOCALES.has(value as Locale);
}

/**
 * Đoán locale ban đầu: localStorage → navigator.language → "vi".
 * Ép về loại supported: "zh-*" → "zh", "en-*" → "en", còn lại "vi".
 */
export function detectInitialLocale(): Locale {
  if (typeof window === "undefined") return "vi";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    // localStorage có thể bị chặn (private mode) — bỏ qua.
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "";
  if (nav.toLowerCase().startsWith("zh")) return "zh";
  if (nav.toLowerCase().startsWith("en")) return "en";
  return "vi";
}

export const LOCALE_STORAGE_KEY = "aiphys.locale";

/** Tạo LocalizedString từ chuỗi (cả 3 ngôn ngữ giống nhau). */
export function ll(value: string): LocalizedString {
  return { vi: value, en: value, zh: value };
}
