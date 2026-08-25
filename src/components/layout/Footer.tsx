import { Link } from "react-router-dom";
import { siteInfo } from "../../data/siteInfo";
import { useT } from "../../i18n/useT";

/**
 * Footer — nhóm nghiên cứu, liên hệ, và liên kết nhanh.
 * Nội dung lấy từ siteInfo.ts để dễ cập nhật sau.
 */
export function Footer() {
  const { t, tr } = useT();
  return (
    <footer
      style={{
        marginTop: "var(--space-8)",
        borderTop: "1px solid var(--color-line)",
        background: "rgba(7,17,31,0.6)",
      }}
    >
      <div
        className="container"
        style={{
          display: "grid",
          gap: "var(--space-5)",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          padding: "var(--space-6) var(--space-5)",
        }}
      >
        <div>
          <p className="eyebrow">{t("footer.researchGroup")}</p>
          <p style={{ marginTop: "var(--space-2)" }}>{tr(siteInfo.researchGroup.name)}</p>
          <p className="muted" style={{ fontSize: "0.9rem" }}>
            {tr(siteInfo.researchGroup.blurbShort)}
          </p>
        </div>
        <div>
          <p className="eyebrow">{t("footer.contact")}</p>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--space-2)" }}>
            <li className="mono" style={{ fontSize: "0.88rem" }}>{siteInfo.contact.email}</li>
            <li className="mono" style={{ fontSize: "0.88rem" }}>{tr(siteInfo.contact.affiliation)}</li>
          </ul>
        </div>
        <div>
          <p className="eyebrow">{t("footer.links")}</p>
          <ul style={{ listStyle: "none", padding: 0, marginTop: "var(--space-2)" }}>
            <li><Link to="/module-1">{t("common.moduleLabel", { n: 1 })} — {t("footer.link.module1")}</Link></li>
            <li><Link to="/module-2">{t("common.moduleLabel", { n: 2 })} — {t("footer.link.module2")}</Link></li>
            <li><Link to="/module-3">{t("common.moduleLabel", { n: 3 })} — {t("footer.link.module3")}</Link></li>
            <li><Link to="/module-4">{t("common.moduleLabel", { n: 4 })} — {t("footer.link.module4")}</Link></li>
          </ul>
        </div>
      </div>
      <div
        className="container"
        style={{
          padding: "var(--space-4) var(--space-5)",
          borderTop: "1px solid var(--color-line)",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)" }}>
          {tr(siteInfo.name)} · {tr(siteInfo.tagline)}
        </span>
        <span className="mono" style={{ fontSize: "0.78rem", color: "var(--color-faint)" }}>
          {t("footer.demoEdu")}
        </span>
      </div>
    </footer>
  );
}
