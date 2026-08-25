import { LOCALES } from "../../i18n/types";
import { useLocaleStore } from "../../i18n/store";
import { useT } from "../../i18n/useT";

/**
 * LanguageSwitcher — 3 nút cờ (VN/EN/ZH) chọn ngôn ngữ.
 * - Lưu vào localStorage qua store, đổi tức thì (component re-render).
 * - Target cảm ứng ≥44px, focus-visible amber, respect prefers-reduced-motion.
 */
export function LanguageSwitcher() {
  const { t, locale } = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);

  return (
    <div
      role="group"
      aria-label={t("lang.aria")}
      style={{ display: "inline-flex", gap: 2, alignItems: "center" }}
    >
      {LOCALES.map((l) => {
        const active = l.code === locale;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            aria-pressed={active}
            aria-label={t(`lang.${l.code}`)}
            title={l.selfName}
            style={{
              minHeight: 44,
              minWidth: 44,
              padding: "0 8px",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "var(--radius-sm)",
              border: active ? "1px solid var(--color-proton-cyan)" : "1px solid transparent",
              background: active ? "rgba(55,215,232,0.12)" : "transparent",
              color: active ? "var(--color-proton-cyan)" : "var(--color-muted)",
              fontFamily: "var(--font-data)",
              fontSize: "0.78rem",
              letterSpacing: "0.04em",
              cursor: "pointer",
              transition: "color 0.15s ease, background 0.15s ease, border-color 0.15s ease",
            }}
          >
            <span aria-hidden style={{ fontSize: "1.05rem", lineHeight: 1 }}>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
