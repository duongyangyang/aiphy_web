/**
 * format — tiện ích định dạng số theo locale (thay `toLocaleString("vi-VN")` cứng).
 */
import { type Locale, LOCALE_TAGS } from "./types";

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions): string {
  return value.toLocaleString(LOCALE_TAGS[locale], options);
}

export function formatHz(value: number, locale: Locale): string {
  return `${formatNumber(value, locale)} Hz`;
}

export function formatDateTime(value: number | string | Date, locale: Locale): string {
  return new Date(value).toLocaleString(LOCALE_TAGS[locale]);
}

export function formatTime(value: number | string | Date, locale: Locale, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleTimeString(LOCALE_TAGS[locale], options);
}
