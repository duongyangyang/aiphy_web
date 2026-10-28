import { Routes, Route, Link } from "react-router-dom";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Module2Shell } from "./module2/Module2Shell";
import { MODULE2_STEPS } from "../stores/module2Types";
import { useT } from "../i18n/useT";

const SIM_PATH = "/module-2/simulator";

/**
 * Module2Page — MRI Simulator.
 *
 * Routing lồng (giống Module 1):
 *   /module-2            → Module2Intro (block giới thiệu + nút vào simulator)
 *   /module-2/simulator  → Module2Shell (luồng 5 bước)
 *
 * Luồng 5 bước mô phỏng phần mềm NMR thật: Prescan → Scout → Scan setup →
 * Scan → Image processing. Toàn bộ trạng thái nằm trong `useModule2Store`
 * (Zustand) và không lưu qua lần tải trang — mỗi ca chụp bắt đầu lại từ đầu.
 */
export default function Module2Page() {
  return (
    <Routes>
      <Route index element={<Module2Intro />} />
      <Route path="simulator" element={<Module2Shell />} />
      <Route path="*" element={<Module2Intro />} />
    </Routes>
  );
}

/**
 * Module2Intro — block giới thiệu Module 2, hiện khi lần đầu vào /module-2.
 * Nút "Đã hiểu, bắt đầu mô phỏng" dẫn vào simulator (nơi bước Prescan mở đầu).
 */
function Module2Intro() {
  const { t, tr } = useT();
  return (
    <section className="container" style={{ padding: "var(--space-6) var(--space-5) var(--space-8)" }}>
      <Card>
        <p className="eyebrow">{t("module2.eyebrow")}</p>
        <h1 style={{ fontSize: "1.8rem", marginTop: "var(--space-2)" }}>{t("module2.introTitle")}</h1>
        <p className="muted" style={{ fontSize: "1.02rem", maxWidth: "62ch" }}>
          {t("module2.introBody")}
        </p>
        <ol style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-3)", maxWidth: "62ch", paddingLeft: 0, listStyle: "none" }}>
          {MODULE2_STEPS.map((s, i) => (
            <li key={s.key} className="muted" style={{ paddingLeft: "var(--space-1)" }}>
              <span className="mono" style={{ color: "var(--color-proton-cyan)" }}>{i + 1}.</span>{" "}
              <strong style={{ color: "var(--color-paper)", fontWeight: 600 }}>{s.tab}</strong>
              {" — "}
              {tr(s.hint)}
            </li>
          ))}
        </ol>
        <div style={{ marginTop: "var(--space-5)", display: "flex", justifyContent: "flex-start" }}>
          <Link to={SIM_PATH}>
            <Button variant="primary" size="lg">{t("module2.start")}</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}
