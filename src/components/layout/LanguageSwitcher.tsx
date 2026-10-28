import { useEffect, useRef, useState } from "react";
import { LOCALES } from "../../i18n/types";
import { useLocaleStore } from "../../i18n/store";
import { useT } from "../../i18n/useT";

/**
 * LanguageSwitcher — một nút gọn mở menu chọn ngôn ngữ.
 *
 * Trước đây là 3 nút cờ chiếm chỗ trên header; gộp lại thành một nút hiển thị
 * ngôn ngữ hiện tại (cờ + mã) và mở dropdown khi bấm. Đóng khi bấm ra ngoài
 * hoặc nhấn Esc.
 */
export function LanguageSwitcher() {
  const { t, locale } = useT();
  const setLocale = useLocaleStore((s) => s.setLocale);

  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.aria")}
        title={current.selfName}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          minHeight: 40,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid var(--color-line-strong)",
          background: "transparent",
          color: "var(--color-paper)",
          fontFamily: "var(--font-data)",
          fontSize: "0.8rem",
          letterSpacing: "0.04em",
          cursor: "pointer",
        }}
      >
        <span aria-hidden style={{ fontSize: "1rem", lineHeight: 1 }}>{current.flag}</span>
        <span>{current.label}</span>
        <span aria-hidden style={{ fontSize: "0.6rem", color: "var(--color-faint)", marginLeft: 1 }}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("lang.aria")}
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 180,
            background: "var(--color-lab-panel)",
            border: "1px solid var(--color-line-strong)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "var(--shadow-panel)",
            padding: "var(--space-2)",
            display: "grid",
            gap: 2,
            zIndex: 60,
          }}
        >
          {LOCALES.map((l) => {
            const active = l.code === locale;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  setLocale(l.code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  width: "100%",
                  minHeight: 38,
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: active ? "rgba(55,215,232,0.12)" : "transparent",
                  color: active ? "var(--color-proton-cyan)" : "var(--color-paper)",
                  fontFamily: "var(--font-body)",
                  fontSize: "0.88rem",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <span aria-hidden style={{ fontSize: "1.05rem", lineHeight: 1 }}>{l.flag}</span>
                <span style={{ flex: 1 }}>{l.selfName}</span>
                {active && <span aria-hidden style={{ fontSize: "0.8rem" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
