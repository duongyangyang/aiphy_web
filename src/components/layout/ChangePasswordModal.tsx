import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { changePassword, ApiError } from "../../auth/api";
import { useT } from "../../i18n/useT";

/**
 * ChangePasswordModal — đổi mật khẩu khi đã đăng nhập.
 *
 * Đổi xong, server giữ phiên hiện tại và huỷ mọi phiên ở thiết bị khác.
 */
export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Reset form mỗi lần mở lại.
  useEffect(() => {
    if (open) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setError(null);
      setDone(false);
    }
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError(t("auth.error.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.error.network"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} labelledBy="change-password-title">
      <h2 id="change-password-title" style={{ fontSize: "1.3rem", margin: 0 }}>
        {t("auth.changePassword")}
      </h2>

      {done ? (
        <>
          <p className="muted" style={{ marginTop: "var(--space-3)" }}>
            {t("auth.passwordChanged")}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
            <Button variant="primary" size="md" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <PasswordField id="cp-current" label={t("auth.currentPassword")} value={current} onChange={setCurrent} />
          <PasswordField id="cp-new" label={t("auth.newPassword")} value={next} onChange={setNext} hint={t("auth.passwordHint")} />
          <PasswordField id="cp-confirm" label={t("auth.confirmPassword")} value={confirm} onChange={setConfirm} />

          {error && (
            <p className="mono" role="alert" style={{ color: "var(--color-danger-red)", fontSize: "0.8rem", margin: 0 }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={submitting}>
              {submitting ? t("auth.submitting") : t("auth.savePassword")}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label htmlFor={id} style={{ display: "grid", gap: "var(--space-1)" }}>
      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
        {label}
      </span>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        minLength={8}
        autoComplete="new-password"
        style={{
          minHeight: 44,
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-line-strong)",
          background: "var(--color-bore-2)",
          color: "var(--color-paper)",
          fontFamily: "var(--font-body)",
        }}
      />
      {hint && <span style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>{hint}</span>}
    </label>
  );
}
