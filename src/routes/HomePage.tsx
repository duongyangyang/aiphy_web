import { Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { modules, type ModuleVisual } from "../data/modules";
import { siteInfo } from "../data/siteInfo";
import { ModuleCardVisual } from "../components/home/ModuleCardVisual";
import { useT } from "../i18n/useT";

/**
 * HomePage — trang chủ theo `overall-design.md`.
 *
 * Các section:
 * 1. Hero (mục tiêu dự án)
 * 2. 3 lối vào module
 * 3. Vì sao MRI quan trọng
 * 4. Nhóm nghiên cứu
 * 5. Liên hệ
 * (Đăng nhập/Đăng ký nằm ở Header, dạng demo.)
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ModuleEntries />
      <MriImportance />
      <ResearchGroup />
      <Contact />
    </>
  );
}

function Hero() {
  const { t, tr } = useT();
  return (
    <section
      className="container"
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)",
        gap: "var(--space-6)",
        alignItems: "center",
        padding: "var(--space-8) var(--space-5) var(--space-7)",
      }}
    >
      <div>
        <p className="eyebrow">{t("home.heroEyebrow")}</p>
        <h1 style={{ fontSize: "clamp(2rem, 4.4vw, 3.2rem)", marginTop: "var(--space-3)" }}>
          {tr(siteInfo.heroHeadline)}
        </h1>
        <p className="muted" style={{ fontSize: "1.08rem", maxWidth: "52ch" }}>
          {tr(siteInfo.heroSubcopy)}
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)", flexWrap: "wrap" }}>
          <Link to="/module-1">
            <Button variant="primary" size="lg">{t("home.enterModule1")}</Button>
          </Link>
          <a href="#modules">
            <Button variant="secondary" size="lg">{t("home.viewModules")}</Button>
          </a>
        </div>
      </div>

      <HeroBoreVisual />
    </section>
  );
}

/**
 * HeroBoreVisual — "resonance bore": vòng cộng hưởng bất đối xứng với vệt
 * tín hiệu FID xoáy vào trong. Đây là signature element của trang.
 */
function HeroBoreVisual() {
  return (
    <div
      aria-hidden
      className="field-grid"
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        maxWidth: 460,
        marginLeft: "auto",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-line)",
        background:
          "radial-gradient(circle at 60% 40%, rgba(55,215,232,0.16), transparent 55%), var(--color-bore-2)",
        overflow: "hidden",
      }}
    >
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        <ellipse cx="100" cy="100" rx="78" ry="62" fill="none" stroke="var(--color-line-strong)" strokeWidth="1" />
        <ellipse cx="100" cy="100" rx="58" ry="46" fill="none" stroke="var(--color-proton-cyan)" strokeWidth="1.2" opacity="0.5" />
        <ellipse cx="100" cy="100" rx="38" ry="30" fill="none" stroke="var(--color-rf-violet)" strokeWidth="1.2" opacity="0.6" />
        <path
          d="M30 110 Q60 60 100 100 T170 90"
          fill="none"
          stroke="var(--color-proton-cyan)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <animate attributeName="d"
            values="M30 110 Q60 60 100 100 T170 90;M30 108 Q60 70 100 96 T170 92;M30 110 Q60 60 100 100 T170 90"
            dur="6s" repeatCount="indefinite" />
        </path>
        <path d="M30 120 L60 118 L80 124 L100 116 L120 122 L140 114 L170 120"
          fill="none" stroke="var(--color-rf-violet)" strokeWidth="1.4" opacity="0.7" />
        <circle cx="100" cy="100" r="3" fill="var(--color-field-amber)" />
      </svg>
      <span className="mono" style={{ position: "absolute", left: 16, bottom: 12, fontSize: "0.7rem", color: "var(--color-faint)" }}>
        FID · T2* · O1
      </span>
    </div>
  );
}

function ModuleEntries() {
  const { t, tr } = useT();
  return (
    <section id="modules" className="container" style={{ padding: "var(--space-6) var(--space-5)" }}>
      <p className="eyebrow">{t("home.modulesEyebrow")}</p>
      <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)" }}>{t("home.modulesTitle")}</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "var(--space-4)",
          marginTop: "var(--space-4)",
        }}
      >
        {modules.map((m) => (
          <Card
            key={m.id}
            as="a"
            href={m.href}
            style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", textDecoration: "none", color: "var(--color-paper)" }}
          >
            <ModuleCardVisual visual={m.visual} />
            <div>
              <p className="mono" style={{ fontSize: "0.74rem", color: "var(--color-faint)" }}>
                {String(m.order).padStart(2, "0")} · {tr(m.subtitle)}
              </p>
              <h3 style={{ fontSize: "1.2rem", margin: "var(--space-1) 0" }}>{tr(m.title)}</h3>
              <p className="muted" style={{ fontSize: "0.92rem", marginBottom: 0 }}>{tr(m.description)}</p>
            </div>
            <span style={{ marginTop: "auto", color: "var(--color-proton-cyan)", fontSize: "0.88rem" }}>
              {m.status === "available" ? t("common.enterModule") : t("common.comingSoon")}
            </span>
          </Card>
        ))}
      </div>
    </section>
  );
}

function MriImportance() {
  const { t } = useT();
  return (
    <section className="container" style={{ padding: "var(--space-7) var(--space-5)" }}>
      <p className="eyebrow">{t("home.importanceEyebrow")}</p>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "var(--space-6)", alignItems: "start" }}>
        <p style={{ fontSize: "1.05rem", maxWidth: "55ch" }}>
          {t("home.importanceBody")}
        </p>
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "var(--space-3)" }}>
          <Stat label={t("home.stat.noRadiation")} value={t("home.stat.radiationValue")} />
          <Stat label={t("home.stat.softTissue")} value={t("home.stat.softTissueValue")} />
          <Stat label={t("home.stat.lessons")} value={t("home.stat.lessonsValue")} />
        </ul>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--color-line)", paddingBottom: "var(--space-2)" }}>
      <span className="muted" style={{ fontSize: "0.92rem" }}>{label}</span>
      <span className="mono" style={{ color: "var(--color-proton-cyan)", fontWeight: 500 }}>{value}</span>
    </li>
  );
}

function ResearchGroup() {
  const { t, tr } = useT();
  return (
    <section className="container" style={{ padding: "var(--space-6) var(--space-5)" }}>
      <p className="eyebrow">{t("home.researchEyebrow")}</p>
      <h2 style={{ fontSize: "1.8rem" }}>{tr(siteInfo.researchGroup.name)}</h2>
      <p className="muted" style={{ maxWidth: "60ch" }}>{tr(siteInfo.researchGroup.blurb)}</p>
    </section>
  );
}

function Contact() {
  const { t, tr } = useT();
  return (
    <section className="container" style={{ padding: "var(--space-6) var(--space-5) var(--space-8)" }}>
      <p className="eyebrow">{t("home.contactEyebrow")}</p>
      <h2 style={{ fontSize: "1.8rem" }}>{t("home.contactTitle")}</h2>
      <p className="muted" style={{ maxWidth: "55ch" }}>
        {t("home.contactBody")}
      </p>
      <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--space-4)", display: "grid", gap: "var(--space-2)" }}>
        <li className="mono">{siteInfo.contact.email}</li>
        <li className="mono muted">{tr(siteInfo.contact.affiliation)}</li>
      </ul>
    </section>
  );
}

export type { ModuleVisual };
