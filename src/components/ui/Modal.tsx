import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useT } from "../../i18n/useT";

interface ModalProps {
  open: boolean;
  /** Cho phép đóng bằng nút Esc / click backdrop hay không. Mặc định true. */
  dismissible?: boolean;
  onClose?: () => void;
  labelledBy?: string;
  children: ReactNode;
}

/**
 * Modal — lớp nền + khung. Khi `dismissible={false}` (dùng cho hộp kiến thức
 * trước bài), không đóng được bằng Esc hay click ra ngoài — chỉ nút nội dung
 * mới đóng được. Mở khóa focus trong khung.
 */
export function Modal({
  open,
  dismissible = true,
  onClose,
  labelledBy,
  children,
}: ModalProps) {
  const { t } = useT();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (!dismissible) return;
      if (e.key === "Escape" && onClose) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevActive?.focus();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: "var(--space-4)",
      }}
    >
      <div
        aria-hidden={!dismissible}
        onClick={() => {
          if (dismissible) onClose?.();
        }}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3, 8, 16, 0.72)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="field-grid"
        style={{
          position: "relative",
          width: "min(640px, 100%)",
          maxHeight: "88vh",
          overflowY: "auto",
          background: "var(--color-lab-panel)",
          border: "1px solid var(--color-line-strong)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-6)",
          boxShadow: "var(--shadow-panel)",
          outline: "none",
        }}
      >
        {/* Nút đóng (x) góc trên-phải — chỉ hiện khi dismissible. Hộp kiến thức
            bắt buộc (dismissible=false) vẫn chỉ đóng qua nút nội dung bên trong. */}
        {dismissible && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close")}
            style={{
              position: "absolute",
              top: "var(--space-3)",
              right: "var(--space-3)",
              width: 32,
              height: 32,
              minHeight: 32,
              display: "inline-grid",
              placeItems: "center",
              padding: 0,
              fontFamily: "var(--font-data)",
              fontSize: "1rem",
              color: "var(--color-muted)",
              background: "rgba(13, 27, 46, 0.7)",
              border: "1px solid var(--color-line)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "color 0.12s ease, border-color 0.12s ease",
            }}
          >
            ✕
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body
  );
}
