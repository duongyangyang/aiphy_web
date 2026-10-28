import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { ModuleCardVisual } from "../home/ModuleCardVisual";
import { useT } from "../../i18n/useT";
import { getModule } from "../../data/modules";
import { getModuleIntro } from "../../data/moduleIntros";
import type { ModuleId } from "../../data/modules";

/**
 * ModuleIntroPage — trang giới thiệu dùng chung cho cả 4 module.
 *
 * Bố cục:
 *   1. Header: số thứ tự + tên module + một đoạn dẫn.
 *   2. Dải thông tin ngắn (số bài, thời lượng, …) — quét nhanh trước khi vào.
 *   3. Ba thẻ "làm gì / học được / vì sao quan trọng".
 *   4. Danh sách các phần của module.
 *   5. Nút vào module.
 *
 * Nội dung nằm trong `src/data/moduleIntros.ts` — sửa nội dung không phải sửa
 * JSX. Nếu module chưa có intro, component vẫn dựng được phần tối thiểu từ
 * registry `modules.ts`.
 */
export function ModuleIntroPage({
  moduleId,
  ctaTo,
}: {
  moduleId: ModuleId;
  /** Đích của nút CTA. Mặc định là `mod.href`; Module 1/2 cần trỏ thẳng vào
   *  bài đầu / simulator thay vì quay lại chính trang intro. */
  ctaTo?: string;
}) {
  const { t, tr } = useT();
  const mod = getModule(moduleId);
  const intro = getModuleIntro(moduleId);
  const target = ctaTo ?? mod?.href ?? "/";

  if (!mod) return null;

  return (
    <section
      className="container"
      style={{ padding: "var(--space-6) var(--space-5) var(--space-8)", display: "grid", gap: "var(--space-5)" }}
    >
      {/* ── Header ── */}
      <header style={{ display: "grid", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <p className="eyebrow" style={{ margin: 0 }}>
            {t("common.moduleLabel", { n: mod.order })}
          </p>
          <span
            className="mono"
            style={{
              fontSize: "0.74rem",
              color: "var(--color-field-amber)",
              border: "1px solid var(--color-line)",
              borderRadius: 999,
              padding: "2px 10px",
            }}
          >
            {tr(mod.subtitle)}
          </span>
        </div>
        <h1 style={{ fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)", margin: 0, maxWidth: "24ch" }}>
          {tr(mod.title)}
        </h1>
        <p className="muted" style={{ fontSize: "1.05rem", maxWidth: "68ch", margin: 0, lineHeight: 1.65 }}>
          {intro ? tr(intro.lead) : tr(mod.description)}
        </p>
      </header>

      {/* ── Dải thông tin ngắn ── */}
      {intro && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--space-2) var(--space-4)",
            paddingTop: "var(--space-3)",
            borderTop: "1px solid var(--color-line)",
          }}
        >
          {intro.meta.map((m, i) => (
            <span
              key={i}
              className="mono"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.8rem", color: "var(--color-muted)" }}
            >
              <span
                aria-hidden
                style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-proton-cyan)" }}
              />
              {tr(m)}
            </span>
          ))}
        </div>
      )}

      {/* ── Ba thẻ highlight + minh hoạ ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
          gap: "var(--space-4)",
          alignItems: "start",
        }}
        className="intro-grid"
      >
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {intro?.highlights.map((h, i) => (
            <Card key={i} style={{ padding: "var(--space-4)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
                <span
                  aria-hidden
                  className="mono"
                  style={{
                    flex: "0 0 auto",
                    display: "inline-grid",
                    placeItems: "center",
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    fontSize: "0.72rem",
                    color: "var(--color-proton-cyan)",
                    border: "1px solid rgba(55,215,232,0.35)",
                    background: "rgba(55,215,232,0.08)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p
                    className="mono"
                    style={{
                      margin: 0,
                      fontSize: "0.72rem",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--color-faint)",
                    }}
                  >
                    {tr(h.label)}
                  </p>
                  <p style={{ margin: "var(--space-1) 0 0", fontSize: "0.95rem", lineHeight: 1.6 }}>
                    {tr(h.body)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: "grid", gap: "var(--space-3)", position: "sticky", top: 88 }}>
          <Card style={{ padding: "var(--space-3)" }}>
            <ModuleCardVisual visual={mod.visual} />
          </Card>

          <Link to={target} style={{ textDecoration: "none" }}>
            <Button variant="primary" size="lg" style={{ width: "100%" }}>
              {intro ? tr(intro.cta) : t("common.enterModule")} →
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Các phần của module ── */}
      {intro && (
        <Card style={{ padding: "var(--space-5)" }}>
          <h2 style={{ fontSize: "1.15rem", margin: "0 0 var(--space-4)" }}>{tr(intro.stepsHeading)}</h2>
          <ol
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "var(--space-3)",
            }}
          >
            {intro.steps.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "grid",
                  gap: 4,
                  paddingLeft: "var(--space-3)",
                  borderLeft: "2px solid var(--color-line-strong)",
                }}
              >
                <span className="mono" style={{ fontSize: "0.7rem", color: "var(--color-proton-cyan)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{tr(s.title)}</span>
                <span className="muted" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {tr(s.hint)}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </section>
  );
}
