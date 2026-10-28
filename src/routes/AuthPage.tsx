import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../auth/store";
import { ApiError } from "../auth/api";
import { useT } from "../i18n/useT";
import { siteInfo } from "../data/siteInfo";

interface AuthPageProps {
  mode: "login" | "register";
}

/**
 * AuthPage — trang đăng nhập / đăng ký dùng chung.
 *
 * Sau khi xác thực thành công, quay lại trang người dùng định vào (state.from)
 * hoặc về trang chủ. Nếu đã đăng nhập mà vào /login thì chuyển thẳng đi.
 */
export default function AuthPage({ mode }: AuthPageProps) {
  const { t, tr } = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStore((s) => s.status);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  const isLogin = mode === "login";
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Đã đăng nhập sẵn (vd mở tab mới) → không hiện form.
  useEffect(() => {
    if (status === "authed") navigate(from, { replace: true });
  }, [status, from, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirm) {
      setError(t("auth.error.passwordMismatch"));
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), name.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.error.network"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="container"
      style={{ padding: "var(--space-7) var(--space-5)", display: "grid", placeItems: "center" }}
    >
      <Card style={{ width: "min(440px, 100%)" }}>
        <p className="eyebrow">{tr(siteInfo.name)}</p>
        <h1 style={{ fontSize: "1.6rem", marginTop: "var(--space-2)" }}>
          {isLogin ? t("auth.login") : t("auth.register")}
        </h1>
        <p className="muted" style={{ fontSize: "0.95rem" }}>
          {isLogin ? t("auth.lead.login") : t("auth.lead.register")}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          {!isLogin && (
            <Field
              id="name"
              label={t("auth.name")}
              type="text"
              value={name}
              onChange={setName}
              autoComplete="name"
              required
              minLength={2}
            />
          )}
          <Field
            id="email"
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <Field
            id="password"
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={8}
            hint={isLogin ? undefined : t("auth.passwordHint")}
          />
          {!isLogin && (
            <Field
              id="confirm"
              label={t("auth.confirmPassword")}
              type="password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              required
              minLength={8}
            />
          )}

          {error && (
            <p className="mono" role="alert" style={{ color: "var(--color-danger-red)", fontSize: "0.8rem", margin: 0 }}>
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting
              ? t("auth.submitting")
              : isLogin
                ? t("auth.submit.login")
                : t("auth.submit.register")}
          </Button>
        </form>

        <p className="muted" style={{ fontSize: "0.88rem", marginTop: "var(--space-4)", marginBottom: 0 }}>
          {isLogin ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <Link to={isLogin ? "/register" : "/login"} style={{ color: "var(--color-proton-cyan)" }}>
            {isLogin ? t("auth.register") : t("auth.login")}
          </Link>
        </p>
      </Card>
    </section>
  );
}

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  hint,
}: {
  id: string;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  hint?: ReactNode;
}) {
  return (
    <label htmlFor={id} style={{ display: "grid", gap: "var(--space-1)" }}>
      <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-muted)" }}>
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        style={{
          minHeight: 44,
          padding: "10px 12px",
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-line-strong)",
          background: "var(--color-bore-2)",
          color: "var(--color-paper)",
          fontFamily: "var(--font-body)",
          fontSize: "0.95rem",
        }}
      />
      {hint && (
        <span style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>{hint}</span>
      )}
    </label>
  );
}
