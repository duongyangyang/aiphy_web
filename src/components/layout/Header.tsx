import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { siteInfo } from "../../data/siteInfo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useT } from "../../i18n/useT";

/**
 * Header — logo + điều hướng 4 module + nút đăng nhập/đăng ký (demo).
 * Click Đăng nhập/Đăng ký mở modal thông báo bản demo chưa hỗ trợ.
 */
export function Header() {
  const { t } = useT();
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoMode, setDemoMode] = useState<"login" | "register">("login");

  function openDemo(mode: "login" | "register") {
    setDemoMode(mode);
    setDemoOpen(true);
  }

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
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button variant="ghost" size="sm" onClick={() => openDemo("login")}>
              {t("header.login")}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openDemo("register")}>
              {t("header.register")}
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={demoOpen}
        dismissible
        onClose={() => setDemoOpen(false)}
        labelledBy="demo-auth-title"
      >
        <p className="eyebrow">{t("header.demo")}</p>
        <h2 id="demo-auth-title" style={{ marginTop: "var(--space-2)" }}>
          {demoMode === "login" ? t("header.login") : t("header.register")}
        </h2>
        <p className="muted">
          {demoMode === "login" ? t("header.demoBody.login") : t("header.demoBody.register")}
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-5)" }}>
          <Button variant="secondary" size="sm" onClick={() => setDemoOpen(false)}>
            {t("header.understood")}
          </Button>
        </div>
        <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginTop: "var(--space-4)" }}>
          {t("header.contact")}: {siteInfo.contact.email}
        </p>
      </Modal>
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
