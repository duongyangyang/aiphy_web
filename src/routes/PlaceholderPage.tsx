import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { getModule } from "../data/modules";
import { getModulePlaceholder } from "../data/modulePlaceholders";
import { useT } from "../i18n/useT";
import type { ModuleId } from "../data/modules";

/**
 * PlaceholderPage — trang cho các module chưa triển khai (hiện là Module 3 & 4).
 *
 * Hiển thị: tên module + giới thiệu ngắn + danh sách "tên các phần" (theo spec
 * `module3-thiet-ke.md` cho Module 4, theo định hướng nghiên cứu cho Module 3).
 * Layout thống nhất để sau này thay nội dung thật mà không đổi trải nghiệm điều
 * hướng. Giữ route không gãy.
 */
export default function PlaceholderPage({ moduleId }: { moduleId: ModuleId }) {
  const { t, tr } = useT();
  const module = getModule(moduleId);
  const placeholder = getModulePlaceholder(moduleId);

  if (!module || !placeholder) {
    // Fallback an toàn nếu thiếu data — không bao giờ sập trang.
    return (
      <section className="container" style={{ padding: "var(--space-8) var(--space-5)", textAlign: "center" }}>
        <p className="eyebrow">{t("placeholderPage.eyebrow")}</p>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)" }}>{t("placeholderPage.title")}</h1>
        <p className="muted" style={{ maxWidth: "52ch", margin: "0 auto" }}>{t("placeholderPage.body")}</p>
        <div style={{ marginTop: "var(--space-5)" }}>
          <Link to="/module-1"><Button variant="primary" size="lg">{t("home.enterModule1")}</Button></Link>
        </div>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "var(--space-7) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-5)" }}>
      <header style={{ display: "grid", gap: "var(--space-2)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <p className="eyebrow" style={{ margin: 0 }}>{t("common.moduleLabel", { n: module.order })}</p>
          <span className="mono" style={{ fontSize: "0.74rem", color: "var(--color-field-amber)", border: "1px solid var(--color-line)", borderRadius: 999, padding: "2px 10px" }}>
            {tr(module.subtitle)}
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", margin: 0 }}>{tr(module.title)}</h1>
        <p className="muted" style={{ maxWidth: "70ch", fontSize: "1.02rem" }}>{tr(placeholder.intro)}</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
        {placeholder.sections.map((sec, si) => (
          <Card key={si} style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <h2 style={{ fontSize: "1.15rem", margin: 0 }}>{tr(sec.heading)}</h2>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-2)" }}>
              {sec.items.map((item, i) => (
                <li key={i} className="muted" style={{ display: "flex", gap: "var(--space-2)", alignItems: "baseline", fontSize: "0.94rem" }}>
                  <span className="mono" style={{ color: "var(--color-proton-cyan)", flex: "0 0 auto" }}>{i + 1}.</span>
                  <span>{tr(item)}</span>
                </li>
              ))}
            </ol>
          </Card>
        ))}
      </div>

      <Card style={{ padding: "var(--space-5)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <p className="muted" style={{ margin: 0, maxWidth: "60ch" }}>{t("placeholderPage.body")}</p>
        <Link to="/module-1"><Button variant="primary" size="lg">{t("home.enterModule1")}</Button></Link>
      </Card>
    </section>
  );
}
