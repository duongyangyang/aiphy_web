import { Link, NavLink } from "react-router-dom";
import { Button } from "../ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { useAuthStore } from "../../auth/store";
import { useT } from "../../i18n/useT";

/**
 * Header — logo + điều hướng 4 module + menu người dùng.
 *
 * Trang chủ xem được khi chưa đăng nhập; các module thì không. Vì vậy khi
 * chưa đăng nhập, header hiện nút "Đăng nhập" thay cho menu người dùng, và
 * các liên kết module sẽ bị `RequireAuth` chuyển về /login.
 */
export function Header() {
  const { t } = useT();
  const status = useAuthStore((s) => s.status);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(7,17,31,0.82)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--color-line)",
      }}
    >
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", minHeight: 64 }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-paper)" }}>
          <span aria-hidden style={{ width: 26, height: 26, display: "inline-block" }}>
            <svg viewBox="0 0 32 32" width="26" height="26">
              <circle cx="16" cy="16" r="9" fill="none" stroke="var(--color-proton-cyan)" strokeWidth="2" />
              <path d="M5 20 L11 16 L16 22 L21 12 L27 18" fill="none" stroke="var(--color-rf-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "-0.01em" }}>
          磁影智析
          </span>
        </Link>

        <nav aria-label={t("header.nav")} style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <NavItem to="/module-1">{t("common.moduleLabel", { n: 1 })}</NavItem>
          <NavItem to="/module-2">{t("common.moduleLabel", { n: 2 })}</NavItem>
          <NavItem to="/module-3">{t("common.moduleLabel", { n: 3 })}</NavItem>
          <NavItem to="/module-4">{t("common.moduleLabel", { n: 4 })}</NavItem>
        </nav>

        <div style={{ marginLeft: "auto", display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <LanguageSwitcher />
          {status === "authed" ? (
            <UserMenu />
          ) : (
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <Button variant="ghost" size="sm">{t("header.login")}</Button>
              </Link>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="sm">{t("header.register")}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        fontFamily: "var(--font-data)",
        fontSize: "0.84rem",
        letterSpacing: "0.04em",
        color: isActive ? "var(--color-proton-cyan)" : "var(--color-muted)",
        textDecoration: "none",
        padding: "6px 0",
        borderBottom: isActive ? "2px solid var(--color-proton-cyan)" : "2px solid transparent",
      })}
    >
      {children}
    </NavLink>
  );
}
