import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../i18n/useT";

/**
 * Toast — thông báo ngắn gọn góc phải dưới, dùng chung cho Module 2. Có nút
 * đóng (x) bắt buộc; tự ẩn sau `autoDismissMs` (nếu > 0). Đặt qua portal lên
 * document.body nên không bị cắt bởi overflow của panel cha.
 *
 * Phong cách "buồng cộng hưởng": nền lab-panel, viền line-strong, chữ paper;
 * tone warn thêm viền amber + icon ⚠, info cyan, success xanh lá. Tôn trọng
 * prefers-reduced-motion (chỉ fade, không slide).
 */
type Tone = "warn" | "info" | "success";

interface ToastProps {
  message: string;
  tone?: Tone;
  onClose: () => void;
  /** 0 = tắt tự động ẩn; >0 = ẩn sau ms. Mặc định 5000. */
  autoDismissMs?: number;
}

const TONE_BORDER: Record<Tone, string> = {
  warn: "var(--color-field-amber)",
  info: "var(--color-proton-cyan)",
  success: "var(--color-success-green)",
};

export function Toast({ message, tone = "warn", onClose, autoDismissMs = 5000 }: ToastProps) {
  const { t } = useT();
  useEffect(() => {
    if (autoDismissMs <= 0) return;
    const id = window.setTimeout(onClose, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [autoDismissMs, onClose, message]); // đổi message → đặt lại đếm ngược

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        right: "var(--space-5)",
        bottom: "var(--space-5)",
        zIndex: 1100,
        maxWidth: "min(420px, calc(100vw - var(--space-7)))",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-2)",
        padding: "var(--space-3) var(--space-3) var(--space-3) var(--space-4)",
        background: "var(--color-lab-panel)",
        border: "1px solid var(--color-line-strong)",
        borderLeft: `3px solid ${TONE_BORDER[tone]}`,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-panel)",
        fontFamily: "var(--font-body)",
        fontSize: "0.86rem",
        color: "var(--color-paper)",
        animation: "m2-toast-in 0.18s ease-out",
      }}
    >
      {tone === "warn" ? (
        <span aria-hidden style={{ color: "var(--color-field-amber)", lineHeight: 1.2 }}>
          ⚠
        </span>
      ) : null}
      <span style={{ flex: 1, minWidth: 0, lineHeight: 1.4 }}>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("common.closeToast")}
        style={{
          flex: "0 0 auto",
          width: 28,
          height: 28,
          minHeight: 28,
          display: "inline-grid",
          placeItems: "center",
          margin: "-2px -2px -2px 0",
          padding: 0,
          fontFamily: "var(--font-data)",
          fontSize: "0.95rem",
          color: "var(--color-muted)",
          background: "transparent",
          border: "1px solid transparent",
          borderRadius: "var(--radius-sm)",
          cursor: "pointer",
          transition: "color 0.12s ease, border-color 0.12s ease",
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes m2-toast-in { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          [role="status"] { animation: none !important; }
        }
      `}</style>
    </div>,
    document.body,
  );
}
