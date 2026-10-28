import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/store";
import { useT } from "../../i18n/useT";
import { ChangePasswordModal } from "./ChangePasswordModal";

/**
 * UserMenu — tên người dùng + menu thả xuống (Dashboard / Đổi mật khẩu / Đăng xuất).
 *
 * Đóng khi bấm ra ngoài hoặc nhấn Esc. Chỉ admin mới thấy mục Dashboard.
 */
export function UserMenu() {
  const { t } = useT();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  if (!user) return null;

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-2)",
          minHeight: 40,
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid var(--color-line-strong)",
          background: "transparent",
          color: "var(--color-paper)",
          fontFamily: "var(--font-data)",
          fontSize: "0.82rem",
          cursor: "pointer",
        }}
      >
        <span
          aria-hidden
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: "rgba(55,215,232,0.16)",
            color: "var(--color-proton-cyan)",
            fontSize: "0.72rem",
            fontWeight: 600,
          }}
        >
          {user.name.trim().charAt(0).toUpperCase()}
        </span>
        <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {user.name}
        </span>
        {user.role === "admin" && (
          <span
            style={{
              fontSize: "0.62rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-field-amber)",
              border: "1px solid rgba(242,184,75,0.4)",
              borderRadius: 999,
              padding: "1px 6px",
            }}
          >
            {t("auth.roleAdmin")}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            minWidth: 220,
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
          <div
            className="mono"
            style={{
              fontSize: "0.72rem",
              color: "var(--color-faint)",
              padding: "6px 10px 8px",
              borderBottom: "1px solid var(--color-line)",
              marginBottom: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {user.email}
          </div>

          {user.role === "admin" && (
            <MenuItem onClick={() => { setOpen(false); navigate("/admin"); }}>
              {t("admin.title")}
            </MenuItem>
          )}

          <MenuItem onClick={() => { setOpen(false); setPasswordOpen(true); }}>
            {t("auth.changePassword")}
          </MenuItem>

          <MenuItem onClick={handleLogout} danger>
            {t("auth.logout")}
          </MenuItem>
        </div>
      )}

      <ChangePasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        textAlign: "left",
        width: "100%",
        minHeight: 38,
        padding: "8px 10px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        background: "transparent",
        color: danger ? "var(--color-danger-red)" : "var(--color-paper)",
        fontFamily: "var(--font-body)",
        fontSize: "0.88rem",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
