import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useT } from "../i18n/useT";

interface AuthDemoPageProps {
  mode: "login" | "register";
}

/**
 * AuthDemoPage — trang đăng nhập/đăng ký dạng demo.
 * Có form frontend nhưng nút gửi chỉ thông báo bản demo chưa hỗ trợ.
 */
export default function AuthDemoPage({ mode }: AuthDemoPageProps) {
  const { t } = useT();
  const isLogin = mode === "login";
  return (
    <section className="container" style={{ padding: "var(--space-7) var(--space-5)", display: "grid", placeItems: "center" }}>
      <Card style={{ width: "min(420px, 100%)" }}>
        <p className="eyebrow">{t("auth.demo")}</p>
        <h1 style={{ fontSize: "1.6rem" }}>{isLogin ? t("auth.login") : t("auth.register")}</h1>
        <p className="muted" style={{ fontSize: "0.95rem" }}>
          {isLogin ? t("auth.body.login") : t("auth.body.register")}
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-4)" }}
          aria-disabled
        >
          {!isLogin && (
            <Field label={t("auth.name")} id="name" type="text" placeholder="" />
          )}
          <Field label={t("auth.email")} id="email" type="email" placeholder="" />
          <Field label={t("auth.password")} id="password" type="password" placeholder="••••••••" />
          <Button type="submit" variant="primary" disabled>
            {isLogin ? t("auth.submit.login") : t("auth.submit.register")}
          </Button>
        </form>
        <p className="mono" style={{ fontSize: "0.72rem", color: "var(--color-faint)", marginTop: "var(--space-4)" }}>
          {t("auth.locked")}
        </p>
      </Card>
    </section>
  );
}

function Field({
  label,
  id,
  type,
  placeholder,
}: {
  label: string;
  id: string;
  type: string;
  placeholder: string;
}) {
  return (
    <label style={{ display: "grid", gap: "var(--space-1)" }}>
      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>{label}</span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled
        style={{
          minHeight: 44,
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-line)",
          background: "rgba(234,246,248,0.04)",
          color: "var(--color-muted)",
          fontFamily: "var(--font-body)",
        }}
      />
    </label>
  );
}
