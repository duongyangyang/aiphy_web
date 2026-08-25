/**
 * locale store — giữ ngôn ngữ hiện tại toàn app (zustand, không thêm middleware).
 *
 * Init theo `detectInitialLocale` (localStorage → navigator.language → "vi").
 * `setLocale` ghi localStorage để nhớ giữa các phiên. Component subscribe qua
 * `useLocale()` để re-render khi đổi ngôn ngữ.
 */
import { create } from "zustand";
import {
  type Locale,
  LOCALE_STORAGE_KEY,
  detectInitialLocale,
} from "./types";

interface LocaleStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: detectInitialLocale(),
  setLocale: (locale) => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // localStorage bị chặn — vẫn đổi locale trong session hiện tại.
    }
    set({ locale });
  },
}));

/** Đọc locale hiện tại ngoài React (trong hàm util/sim). */
export function getCurrentLocale(): Locale {
  return useLocaleStore.getState().locale;
}
