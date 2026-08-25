import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { useT } from "../i18n/useT";

export default function NotFoundPage() {
  const { t } = useT();
  return (
    <section className="container" style={{ padding: "var(--space-8) var(--space-5)", textAlign: "center" }}>
      <p className="eyebrow">{t("notFound.eyebrow")}</p>
      <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>{t("notFound.title")}</h1>
      <p className="muted" style={{ maxWidth: "48ch", margin: "0 auto" }}>
        {t("notFound.body")}
      </p>
      <div style={{ marginTop: "var(--space-5)", display: "flex", gap: "var(--space-2)", justifyContent: "center" }}>
        <Link to="/"><Button variant="secondary" size="lg">{t("notFound.home")}</Button></Link>
        <Link to="/module-1"><Button variant="primary" size="lg">{t("notFound.module1")}</Button></Link>
      </div>
    </section>
  );
}
