/**
 * useT — hook dịch duy nhất cho component.
 *
 * Trả về:
 * - `t(key, vars?)`: tra UI chrome key trong dictionary hiện tại. Fallback:
 *   dictionary `vi` → trả key gốc nếu thiếu (không crash).
 * - `tr(localized)`: resolve `LocalizedString` (hoặc chuỗi thuần) theo locale.
 * - `locale`: locale hiện tại (cho logic rẽ nhánh/định dạng).
 *
 * Hook subscribe `locale` từ store → component re-render khi đổi ngôn ngữ.
 */
import { useLocaleStore } from "./store";
import { type Locale, type LocalizedString } from "./types";
import { vi } from "./locales/vi";
import { en } from "./locales/en";
import { zh } from "./locales/zh";

const DICTS: Record<Locale, Record<string, string>> = { vi, en, zh };

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

export interface T {
  t: (key: string, vars?: Vars) => string;
  tr: (value: LocalizedString | string) => string;
  locale: Locale;
}

export function useT(): T {
  const locale = useLocaleStore((s) => s.locale);
  const dict = DICTS[locale];
  const fallback = DICTS.vi;

  const t = (key: string, vars?: Vars): string => {
    const raw = dict[key] ?? fallback[key] ?? key;
    return interpolate(raw, vars);
  };

  const tr = (value: LocalizedString | string): string => {
    if (typeof value === "string") return value;
    return value[locale] ?? value.vi ?? "";
  };

  return { t, tr, locale };
}
